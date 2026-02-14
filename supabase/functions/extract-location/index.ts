import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Strategy 1: TikTok oEmbed (free, no auth needed)
async function fetchTikTokOembed(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl);
    if (!resp.ok) {
      console.log("TikTok oEmbed failed:", resp.status);
      return null;
    }
    const data = await resp.json();
    const parts: string[] = [];
    if (data.title) parts.push(`Caption: ${data.title}`);
    if (data.author_name) parts.push(`Author: ${data.author_name}`);
    if (data.author_url) parts.push(`Profile: ${data.author_url}`);
    const text = parts.join("\n");
    console.log("TikTok oEmbed success, content length:", text.length);
    return text || null;
  } catch (e) {
    console.error("TikTok oEmbed error:", e);
    return null;
  }
}

// Strategy 2: Instagram oEmbed (requires app token, try without)
async function fetchInstagramOembed(url: string): Promise<string | null> {
  try {
    // Try the public endpoint (may be rate limited)
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Kohay/1.0)" },
    });
    if (!resp.ok) {
      console.log("Instagram oEmbed failed:", resp.status);
      return null;
    }
    const data = await resp.json();
    const parts: string[] = [];
    if (data.title) parts.push(`Caption: ${data.title}`);
    if (data.author_name) parts.push(`Author: ${data.author_name}`);
    if (data.author_url) parts.push(`Profile: ${data.author_url}`);
    const text = parts.join("\n");
    console.log("Instagram oEmbed success, content length:", text.length);
    return text || null;
  } catch (e) {
    console.error("Instagram oEmbed error:", e);
    return null;
  }
}

// Strategy 3: Firecrawl (for non-TikTok/IG URLs)
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

function detectPlatform(url: string): "tiktok" | "instagram" | "youtube" | "other" {
  if (url.includes("tiktok.com") || url.includes("vm.tiktok.com")) return "tiktok";
  if (url.includes("instagram.com") || url.includes("instagr.am")) return "instagram";
  if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
  return "other";
}

async function getPageContent(url: string): Promise<{ content: string | null; platform: string }> {
  const platform = detectPlatform(url);

  let content: string | null = null;

  if (platform === "tiktok") {
    content = await fetchTikTokOembed(url);
  } else if (platform === "instagram") {
    content = await fetchInstagramOembed(url);
  }

  // Fallback to Firecrawl for other platforms or if oEmbed failed
  if (!content) {
    content = await scrapeWithFirecrawl(url);
  }

  return { content, platform };
}

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

    // Step 1: Get page content via oEmbed or Firecrawl
    const { content: scrapedContent } = await getPageContent(url);
    const hasContent = !!scrapedContent && scrapedContent.length > 20;

    // Step 2: Build AI prompt
    const systemPrompt = hasContent
      ? `You are a location extraction assistant for a travel app called Kohay.
You are given a social media URL AND the post's caption/content.

Your job is to extract the SPECIFIC real-world location/venue/place being featured.

Rules:
- Prioritize explicit location mentions: 📍 pins, tagged locations, addresses, city/country names
- Look for hashtags that mention places (e.g. #tokyo #cafeparis #nycfood)
- Look for business/venue names in the caption
- If coordinates or addresses are visible, use those
- Set confidence to "high" if you found an explicit venue name or location tag
- Set confidence to "medium" if you inferred from hashtags/context
- Set confidence to "low" if you're mostly guessing
- Extract the relevant caption text as source_caption`
      : `You are a location extraction assistant for a travel app called Kohay.
You only have the URL (no page content was available). Try to extract any location hints from the URL itself.
Set confidence to "low" since you cannot see the actual post content.`;

    const userMessage = hasContent
      ? `Extract location info from this social media post.

URL: ${url}

Post content:
${scrapedContent!.slice(0, 8000)}`
      : `Extract location info from this URL (no page content available): ${url}`;

    // Step 3: Call AI
    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userMessage },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_location",
                description: "Extract structured location data from a social media post",
                parameters: {
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
                },
              },
            },
          ],
          tool_choice: { type: "function", function: { name: "extract_location" } },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("AI did not return structured location data");

    const locationData = JSON.parse(toolCall.function.arguments);

    if (!hasContent && locationData.confidence !== "low") {
      locationData.confidence = "low";
    }

    console.log("Result:", JSON.stringify({ place: locationData.place_name, confidence: locationData.confidence, hadContent: hasContent }));

    return new Response(JSON.stringify({ success: true, data: locationData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-location error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
