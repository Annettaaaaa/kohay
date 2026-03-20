import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ─── Short URL Resolution ────────────────────────────────────────────────────

async function resolveShortUrl(url: string): Promise<string> {
  if (!url.includes("vm.tiktok.com") && !url.includes("vt.tiktok.com")) {
    return url;
  }
  try {
    const resp = await fetch(url, { method: "HEAD", redirect: "manual" });
    const location = resp.headers.get("location");
    if (location && location.startsWith("http")) {
      console.log("Resolved short URL:", url, "→", location);
      return location;
    }
  } catch (e) {
    console.log("Short URL resolution failed, using original:", e);
  }
  return url;
}

// ─── Caption Pre-Processor ───────────────────────────────────────────────────

interface PreprocessedCaption {
  pinLocations: string[];
  labelLocations: string[];
  locationHashtags: string[];
  rawCaption: string;
  structuredSummary: string;
}

const KNOWN_CITIES = new Set([
  "tokyo", "osaka", "kyoto", "seoul", "beijing", "shanghai", "singapore",
  "bangkok", "bali", "jakarta", "manila", "taipei", "hongkong", "dubai",
  "istanbul", "paris", "london", "berlin", "rome", "madrid", "amsterdam",
  "barcelona", "prague", "vienna", "lisbon", "stockholm", "copenhagen",
  "nyc", "newyork", "losangeles", "chicago", "miami", "lasvegas", "sf",
  "sanfrancisco", "boston", "seattle", "toronto", "vancouver", "sydney",
  "melbourne", "capetown", "nairobi", "cairo", "mexico", "cancun", "rio",
]);

function preprocessCaption(rawCaption: string): PreprocessedCaption {
  if (!rawCaption || rawCaption.trim().length === 0) {
    return {
      pinLocations: [],
      labelLocations: [],
      locationHashtags: [],
      rawCaption: rawCaption || "",
      structuredSummary: "No caption available.",
    };
  }

  // 📍 pin patterns
  const pinLocations: string[] = [];
  const pinRegex = /📍\s*([^#\n,]+(?:,\s*[^#\n]+)?)/g;
  let m: RegExpExecArray | null;
  while ((m = pinRegex.exec(rawCaption)) !== null) {
    const val = m[1].trim();
    if (val) pinLocations.push(val);
  }

  // explicit label patterns
  const labelLocations: string[] = [];
  const labelRegex = /(location|place|venue|at|spot)\s*[:\-]\s*([^\n#]+)/gi;
  while ((m = labelRegex.exec(rawCaption)) !== null) {
    const val = m[2].trim();
    if (val) labelLocations.push(val);
  }

  // geographic hashtags
  const locationHashtags: string[] = [];
  const hashRegex = /#([a-zA-Z][a-zA-Z0-9]*)/g;
  while ((m = hashRegex.exec(rawCaption)) !== null) {
    const tag = m[1].toLowerCase();
    const isGeo = KNOWN_CITIES.has(tag) ||
      /^(.*)(city|cafe|bar|hotel|beach|park|market|temple|museum|restaurant|ramen|sushi|izakaya)$/.test(tag) ||
      /^(city|cafe|bar|hotel|beach|park|market|temple|museum|restaurant)(.*)?$/.test(tag);
    if (isGeo) locationHashtags.push(`#${m[1]}`);
  }

  const parts: string[] = ["--- Extracted location signals ---"];
  if (pinLocations.length > 0) parts.push(`Pin markers: ${pinLocations.join("; ")}`);
  if (labelLocations.length > 0) parts.push(`Location labels: ${labelLocations.join("; ")}`);
  if (locationHashtags.length > 0) parts.push(`Geographic hashtags: ${locationHashtags.join(", ")}`);
  if (pinLocations.length === 0 && labelLocations.length === 0 && locationHashtags.length === 0) {
    parts.push("(no explicit location signals found)");
  }
  parts.push("---");

  const structuredSummary = parts.join("\n");

  return { pinLocations, labelLocations, locationHashtags, rawCaption, structuredSummary };
}

// ─── TikTok oEmbed ───────────────────────────────────────────────────────────

interface TikTokResult {
  content: string;
  authorUsername: string;
  preprocessed: PreprocessedCaption;
}

async function fetchTikTokOembed(url: string): Promise<TikTokResult | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl);
    if (!resp.ok) {
      console.log("TikTok oEmbed failed:", resp.status);
      return null;
    }
    const data = await resp.json();
    const caption = data.title || "";
    const authorName = data.author_name || "";
    const authorUsername = data.author_url
      ? data.author_url.replace(/^https?:\/\/(?:www\.)?tiktok\.com\/@?/, "").replace(/\/$/, "")
      : "";

    const preprocessed = preprocessCaption(caption);

    const content = `${preprocessed.structuredSummary}

[RAW CAPTION]
${caption}

[AUTHOR]
${authorName}${authorUsername ? ` (@${authorUsername})` : ""}`;

    console.log("TikTok oEmbed success, content length:", content.length);
    return { content, authorUsername, preprocessed };
  } catch (e) {
    console.error("TikTok oEmbed error:", e);
    return null;
  }
}

// ─── Instagram Fetching ───────────────────────────────────────────────────────

async function fetchInstagramContent(url: string): Promise<{ content: string; preprocessed: PreprocessedCaption } | null> {
  // Strategy A: oEmbed with browser headers
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json,*/*",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (resp.ok) {
      const data = await resp.json();
      const caption = data.title || "";
      const authorName = data.author_name || "";
      if (caption) {
        const preprocessed = preprocessCaption(caption);
        const content = `${preprocessed.structuredSummary}

[RAW CAPTION]
${caption}

[AUTHOR]
${authorName}`;
        console.log("Instagram oEmbed success (strategy A), content length:", content.length);
        return { content, preprocessed };
      }
    } else {
      console.log("Instagram oEmbed strategy A failed:", resp.status);
    }
  } catch (e) {
    console.log("Instagram oEmbed strategy A error:", e);
  }

  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    console.log("No Firecrawl API key, skipping Instagram strategies B and C");
    return null;
  }

  // Strategy B: Firecrawl with mobile User-Agent
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["markdown"],
        onlyMainContent: false,
        waitFor: 5000,
        headers: {
          "Accept-Language": "en-US,en;q=0.9",
          "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
        },
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const markdown = data?.data?.markdown || data?.markdown || null;
      if (markdown && markdown.length > 50 && !markdown.includes("Log in") && !markdown.includes("Sign in to Instagram")) {
        const preprocessed = preprocessCaption(markdown.slice(0, 2000));
        console.log("Instagram Firecrawl mobile strategy B success, content length:", markdown.length);
        return { content: `${preprocessed.structuredSummary}\n\n[PAGE CONTENT]\n${markdown}`, preprocessed };
      }
    }
    console.log("Instagram Firecrawl strategy B failed or returned login page");
  } catch (e) {
    console.log("Instagram Firecrawl strategy B error:", e);
  }

  // Strategy C: Firecrawl rawHtml + og:description extraction
  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        url,
        formats: ["rawHtml"],
        waitFor: 3000,
      }),
    });
    if (response.ok) {
      const data = await response.json();
      const html: string = data?.data?.rawHtml || data?.rawHtml || "";
      if (html) {
        // Extract og:description
        const ogDescMatch = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:description["']/i);
        const ogTitleMatch = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
          || html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:title["']/i);

        const ogDescription = ogDescMatch ? ogDescMatch[1] : null;
        const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

        if (ogDescription || ogTitle) {
          const caption = ogDescription || ogTitle || "";
          const preprocessed = preprocessCaption(caption);
          const content = `[SOURCE: og:description]\n${ogTitle ? `Title: ${ogTitle}\n` : ""}${ogDescription || ""}

${preprocessed.structuredSummary}`;
          console.log("Instagram strategy C (og:description) success");
          return { content, preprocessed };
        }
      }
    }
    console.log("Instagram strategy C failed");
  } catch (e) {
    console.log("Instagram strategy C error:", e);
  }

  return null;
}

// ─── Firecrawl fallback ───────────────────────────────────────────────────────

async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;

  try {
    console.log("Scraping with Firecrawl:", url);
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Firecrawl error:", response.status);
      return null;
    }

    const markdown = data?.data?.markdown || data?.markdown || null;
    console.log("Firecrawl success, content length:", markdown?.length || 0);
    return markdown;
  } catch (e) {
    console.error("Firecrawl error:", e);
    return null;
  }
}

// ─── Platform Detection ───────────────────────────────────────────────────────

function detectPlatform(url: string): "tiktok" | "instagram" | "youtube" | "other" {
  if (url.includes("tiktok.com")) return "tiktok";
  if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "other";
}

// ─── Page Content Orchestrator ────────────────────────────────────────────────

async function getPageContent(url: string): Promise<{
  content: string | null;
  platform: string;
  preprocessed: PreprocessedCaption | null;
  resolvedUrl: string;
  authorUsername: string | null;
}> {
  const resolvedUrl = await resolveShortUrl(url);
  const platform = detectPlatform(resolvedUrl);

  let content: string | null = null;
  let preprocessed: PreprocessedCaption | null = null;
  let authorUsername: string | null = null;

  if (platform === "tiktok") {
    const result = await fetchTikTokOembed(resolvedUrl);
    if (result) {
      content = result.content;
      preprocessed = result.preprocessed;
      authorUsername = result.authorUsername || null;
    }
  } else if (platform === "instagram") {
    const result = await fetchInstagramContent(resolvedUrl);
    if (result) {
      content = result.content;
      preprocessed = result.preprocessed;
    }
  }

  // Fallback to Firecrawl for other platforms or if platform-specific fetch failed
  if (!content) {
    content = await scrapeWithFirecrawl(resolvedUrl);
  }

  return { content, platform, preprocessed, resolvedUrl, authorUsername };
}

// ─── Prompt Builder ───────────────────────────────────────────────────────────

function buildSystemPrompt(platform: string, hasContent: boolean, hasSignals: boolean): string {
  if (!hasContent) {
    return `You are a location extraction assistant for a travel app called Kohay.
You only have the URL (no page content was available). Try to extract any location hints from the URL itself.
Set confidence to "low" since you cannot see the actual post content.`;
  }

  const sharedRules = `Rules:
- Extract EVERY distinct venue or place mentioned — if the post visits multiple spots, include ALL of them
- Confidence hierarchy: explicit 📍 pin = high, venue name in caption = high, geographic hashtags only = medium, only city/country = medium, guessing = low
- Prioritize explicit location mentions: 📍 pins, tagged locations, addresses, city/country names
- If coordinates or addresses are visible, use those
- Never fabricate coordinates — only provide lat/lng when you have high confidence in the specific venue
- Extract the relevant caption text as source_caption for each place`;

  if (platform === "tiktok") {
    return `You are a location extraction assistant for a travel app called Kohay.
You are given a TikTok post's caption and pre-extracted location signals.

Platform: TikTok

TikTok-specific extraction rules:
${hasSignals ? "- The \"Extracted location signals\" section contains pre-parsed signals — treat Pin markers as ground truth (highest confidence)" : ""}
- If you see "📍 [Name], [City]" format, use Name as place_name and City as part of address
- TikTok captions often follow: [emoji] [venue name] + [location hashtags]. The venue comes first.
- Hashtags like #cafetokyo #tokyocafe suggest venue type + city
- Geographic hashtags are secondary signals — use them to confirm city/country

${sharedRules}`;
  }

  if (platform === "instagram") {
    return `You are a location extraction assistant for a travel app called Kohay.
You are given an Instagram post's content/caption.

Platform: Instagram

Instagram-specific extraction rules:
- Look for @mentions of venue accounts (e.g. @bluebottle) as venue name signals
- Captions often start with description, then location details appear mid-caption or at end
- When og:description is the only source, the venue name often appears in the first sentence
- "Location:" labels at the start of a caption are high-confidence signals

${sharedRules}`;
  }

  return `You are a location extraction assistant for a travel app called Kohay.
You are given a social media URL AND the post's caption/content.

Your job is to extract the SPECIFIC real-world location/venue/place being featured.

${sharedRules}`;
}

// ─── Few-Shot Examples ────────────────────────────────────────────────────────

const PLACE_SCHEMA = {
  type: "object",
  properties: {
    place_name: { type: "string", description: "Name of the place/venue" },
    category: {
      type: "string",
      enum: ["gym", "food", "library", "museum", "cafe", "park", "shopping", "nightlife", "hotel", "beach", "other"],
      description: "Category of the place",
    },
    address: { type: "string", description: "Full address or city/country" },
    latitude: { type: "number", description: "Approximate latitude" },
    longitude: { type: "number", description: "Approximate longitude" },
    description: { type: "string", description: "Brief description of the place (1-2 sentences)" },
    source_username: { type: "string", description: "Username from the social media post" },
    platform: {
      type: "string",
      enum: ["tiktok", "instagram", "youtube", "other"],
      description: "Social media platform",
    },
    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
      description: "high = explicit location found, medium = inferred from context, low = guessing",
    },
    source_caption: {
      type: "string",
      description: "The relevant caption/text from the post mentioning the location",
    },
  },
  required: ["place_name", "category", "address", "description", "platform", "confidence"],
  additionalProperties: false,
};

const EXTRACT_LOCATIONS_TOOL_DEF = {
  type: "function",
  function: {
    name: "extract_locations",
    description: "Extract ALL locations/venues mentioned in the social media post. Return every place visited or mentioned — if the post visits multiple spots, include all of them.",
    parameters: {
      type: "object",
      properties: {
        places: {
          type: "array",
          description: "All distinct real-world venues/places mentioned. Include multiple if the post covers multiple spots.",
          items: PLACE_SCHEMA,
        },
      },
      required: ["places"],
      additionalProperties: false,
    },
  },
};

const fewShotExamples = [
  // Example 1: TikTok day-trip with multiple venues — returns all of them
  {
    role: "user",
    content: `Extract ALL locations from this social media post.

URL: https://www.tiktok.com/@foodie/video/7123456789

--- Extracted location signals ---
Pin markers: Ichiran Ramen, Shibuya; Shibuya Scramble Square
Geographic hashtags: #ramen, #tokyo, #shibuya
---

[RAW CAPTION]
Tokyo day trip 🗼 started at 📍 Ichiran Ramen, Shibuya then grabbed coffee at 📍 Shibuya Scramble Square #ramen #tokyo #shibuya #japan #foodtok

[AUTHOR]
foodienyc (@foodie)`,
  },
  {
    role: "assistant",
    content: null,
    tool_calls: [{
      id: "ex1",
      type: "function",
      function: {
        name: "extract_locations",
        arguments: JSON.stringify({
          places: [
            {
              place_name: "Ichiran Ramen Shibuya",
              category: "food",
              address: "Shibuya, Tokyo, Japan",
              latitude: 35.6598,
              longitude: 139.7004,
              description: "Famous solo-booth ramen chain, Shibuya branch.",
              confidence: "high",
              source_caption: "📍 Ichiran Ramen, Shibuya",
              platform: "tiktok",
              source_username: "foodie",
            },
            {
              place_name: "Shibuya Scramble Square",
              category: "other",
              address: "2 Chome-24-12 Shibuya, Tokyo, Japan",
              latitude: 35.6581,
              longitude: 139.7017,
              description: "Major skyscraper complex above Shibuya Station.",
              confidence: "high",
              source_caption: "📍 Shibuya Scramble Square",
              platform: "tiktok",
              source_username: "foodie",
            },
          ],
        }),
      },
    }],
  },
  // Example 2: TikTok single cafe with hashtags only
  {
    role: "user",
    content: `Extract ALL locations from this social media post.

URL: https://www.tiktok.com/@traveler/video/7987654321

--- Extracted location signals ---
Pin markers: (none)
Geographic hashtags: #paris, #cafeparis, #montmartre
---

[RAW CAPTION]
morning vibes ☕ #paris #cafeparis #montmartre #travel

[AUTHOR]
traveler (@traveler)`,
  },
  {
    role: "assistant",
    content: null,
    tool_calls: [{
      id: "ex2",
      type: "function",
      function: {
        name: "extract_locations",
        arguments: JSON.stringify({
          places: [
            {
              place_name: "Café in Montmartre",
              category: "cafe",
              address: "Montmartre, Paris, France",
              latitude: 48.8867,
              longitude: 2.3431,
              description: "A café in the Montmartre neighborhood of Paris.",
              confidence: "medium",
              source_caption: "#cafeparis #montmartre",
              platform: "tiktok",
              source_username: "traveler",
            },
          ],
        }),
      },
    }],
  },
];

// ─── AI Caller ────────────────────────────────────────────────────────────────

async function callAI(
  apiKey: string,
  messages: object[],
): Promise<{ places: Record<string, unknown>[] } | null> {
  const response = await fetch(
    "https://ai.gateway.lovable.dev/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages,
        tools: [EXTRACT_LOCATIONS_TOOL_DEF],
        tool_choice: { type: "function", function: { name: "extract_locations" } },
      }),
    }
  );

  if (!response.ok) {
    if (response.status === 429) throw Object.assign(new Error("rate_limit"), { status: 429 });
    if (response.status === 402) throw Object.assign(new Error("credits_exhausted"), { status: 402 });
    const text = await response.text();
    console.error("AI gateway error:", response.status, text);
    throw new Error("AI gateway error");
  }

  const data = await response.json();
  const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
  if (!toolCall) return null;

  const parsed = JSON.parse(toolCall.function.arguments);
  const places: Record<string, unknown>[] = Array.isArray(parsed.places) ? parsed.places : [parsed];
  return { places };
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { url } = await req.json();
    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Step 1: Get page content
    const { content: scrapedContent, platform, preprocessed, resolvedUrl, authorUsername } =
      await getPageContent(url);
    const hasContent = !!scrapedContent && scrapedContent.length > 20;
    const hasSignals = !!(
      preprocessed &&
      (preprocessed.pinLocations.length > 0 ||
        preprocessed.labelLocations.length > 0 ||
        preprocessed.locationHashtags.length > 0)
    );

    // Step 2: Build prompt
    const systemPrompt = buildSystemPrompt(platform, hasContent, hasSignals);

    const userMessage = hasContent
      ? `Extract ALL locations from this social media post. Include every venue or place mentioned, not just the primary one.\n\nURL: ${resolvedUrl}\n\n${scrapedContent!.slice(0, 8000)}`
      : `Extract ALL locations from this URL (no page content available): ${resolvedUrl}`;

    const messages = [
      { role: "system", content: systemPrompt },
      ...fewShotExamples,
      { role: "user", content: userMessage },
    ];

    // Step 3: First AI call
    const result = await callAI(LOVABLE_API_KEY, messages);
    if (!result) throw new Error("AI did not return structured location data");

    let places = result.places;

    // Step 4: Low-confidence retry when we have content and all results are low
    const allLowConfidence = places.every((p) => p.confidence === "low");
    if (allLowConfidence && hasContent) {
      console.log("All low confidence, retrying with focused prompt...");
      const retryMessages = [
        ...messages,
        {
          role: "assistant",
          content: null,
          tool_calls: [{
            id: "retry_ctx",
            type: "function",
            function: {
              name: "extract_locations",
              arguments: JSON.stringify({ places }),
            },
          }],
        },
        {
          role: "user",
          content: `The previous extraction had low confidence. Focus specifically on: 📍 symbols, any venue/business names, addresses, or recognizable place names. Re-examine carefully:\n\n${scrapedContent!.slice(0, 8000)}`,
        },
      ];

      const retryResult = await callAI(LOVABLE_API_KEY, retryMessages).catch((e) => {
        console.log("Retry AI call failed:", e);
        return null;
      });

      if (retryResult && retryResult.places.some((p) => p.confidence !== "low")) {
        console.log("Retry improved confidence");
        places = retryResult.places;
      }
    }

    // Step 5: Ensure confidence is "low" when we had no content
    if (!hasContent) {
      places = places.map((p) => ({ ...p, confidence: "low" }));
    }

    // Step 6: Backfill source_username and platform from oEmbed if AI didn't set them
    places = places.map((p) => ({
      ...p,
      source_username: p.source_username || authorUsername || undefined,
      platform: p.platform || platform,
    }));

    console.log("Result:", JSON.stringify({
      placeCount: places.length,
      places: places.map((p) => ({ name: p.place_name, confidence: p.confidence })),
      hadContent: hasContent,
      platform,
      hadPreprocessedSignals: hasSignals,
    }));

    return new Response(JSON.stringify({ success: true, places }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    console.error("extract-location error:", e);

    if (err.status === 429) {
      return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (err.status === 402) {
      return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
