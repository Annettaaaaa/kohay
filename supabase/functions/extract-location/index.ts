import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// --- Auth helper ---
async function authenticateRequest(req: Request): Promise<{ userId: string } | Response> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const token = authHeader.replace("Bearer ", "");
  const { data, error } = await supabaseClient.auth.getUser(token);
  if (error || !data?.user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return { userId: data.user.id };
}

// Strategy 1: TikTok oEmbed (free, no auth needed)
async function fetchTikTokOembed(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl);
    if (!resp.ok) return null;
    const data = await resp.json();
    const parts: string[] = [];
    if (data.title) parts.push(`Caption: ${data.title}`);
    if (data.author_name) parts.push(`Author: ${data.author_name}`);
    if (data.author_url) parts.push(`Profile: ${data.author_url}`);
    const text = parts.join("\n");
    return text || null;
  } catch {
    return null;
  }
}

// Strategy 2: Instagram oEmbed
async function fetchInstagramOembed(url: string): Promise<string | null> {
  try {
    const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}`;
    const resp = await fetch(oembedUrl, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Kohay/1.0)" },
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const parts: string[] = [];
    if (data.title) parts.push(`Caption: ${data.title}`);
    if (data.author_name) parts.push(`Author: ${data.author_name}`);
    if (data.author_url) parts.push(`Profile: ${data.author_url}`);
    const text = parts.join("\n");
    return text || null;
  } catch {
    return null;
  }
}

// Strategy 3: Firecrawl
async function scrapeWithFirecrawl(url: string): Promise<string | null> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) return null;

  try {
    const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ url, formats: ["markdown"], onlyMainContent: true, waitFor: 3000 }),
    });

    const data = await response.json();
    if (!response.ok) return null;

    return data?.data?.markdown || data?.markdown || null;
  } catch {
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

  if (!content) {
    content = await scrapeWithFirecrawl(url);
  }

  return { content, platform };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Authenticate
  const authResult = await authenticateRequest(req);
  if (authResult instanceof Response) return authResult;

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

    const { content: scrapedContent } = await getPageContent(url);
    const hasContent = !!scrapedContent && scrapedContent.length > 20;

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
      ? `Extract location info from this social media post.\n\nURL: ${url}\n\nPost content:\n${scrapedContent!.slice(0, 8000)}`
      : `Extract location info from this URL (no page content available): ${url}`;

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
                    },
                    address: { type: "string", description: "Full address or city/country" },
                    latitude: { type: "number" },
                    longitude: { type: "number" },
                    description: { type: "string", description: "Brief description (1-2 sentences)" },
                    source_username: { type: "string" },
                    platform: { type: "string", enum: ["tiktok", "instagram", "youtube", "other"] },
                    confidence: { type: "string", enum: ["high", "medium", "low"] },
                    source_caption: { type: "string" },
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
      console.error("AI gateway error:", response.status);
      if (response.status === 429 || response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Service temporarily unavailable. Please try again later." }),
          { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("Failed to extract location data");

    const locationData = JSON.parse(toolCall.function.arguments);

    if (!hasContent && locationData.confidence !== "low") {
      locationData.confidence = "low";
    }

    return new Response(JSON.stringify({ success: true, data: locationData }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("extract-location error:", e);
    return new Response(
      JSON.stringify({ error: "Failed to extract location. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
