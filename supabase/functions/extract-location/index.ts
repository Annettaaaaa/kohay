import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
            {
              role: "system",
              content: `You are a location extraction assistant for a travel app called Kohay. 
Given a social media URL (TikTok, Instagram, etc.), analyze the URL and any context clues to extract location information.

Return structured data about the place mentioned. If you can't determine exact details, make your best educated guess based on the URL patterns, username hints, and common social media location tagging patterns.`,
            },
            {
              role: "user",
              content: `Extract location info from this social media link: ${url}

Provide your best guess for the place being featured.`,
            },
          ],
          tools: [
            {
              type: "function",
              function: {
                name: "extract_location",
                description:
                  "Extract structured location data from a social media post",
                parameters: {
                  type: "object",
                  properties: {
                    place_name: {
                      type: "string",
                      description: "Name of the place/venue",
                    },
                    category: {
                      type: "string",
                      enum: ["gym", "food", "library", "museum", "cafe", "park", "shopping", "nightlife", "other"],
                      description: "Category of the place",
                    },
                    address: {
                      type: "string",
                      description: "Full address or city/country",
                    },
                    latitude: {
                      type: "number",
                      description: "Approximate latitude",
                    },
                    longitude: {
                      type: "number",
                      description: "Approximate longitude",
                    },
                    description: {
                      type: "string",
                      description: "Brief description of the place (1-2 sentences)",
                    },
                    source_username: {
                      type: "string",
                      description: "Username from the social media post if identifiable",
                    },
                    platform: {
                      type: "string",
                      enum: ["tiktok", "instagram", "youtube", "other"],
                      description: "Social media platform",
                    },
                  },
                  required: ["place_name", "category", "address", "description", "platform"],
                  additionalProperties: false,
                },
              },
            },
          ],
          tool_choice: {
            type: "function",
            function: { name: "extract_location" },
          },
        }),
      }
    );

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const text = await response.text();
      console.error("AI gateway error:", response.status, text);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];

    if (!toolCall) {
      throw new Error("AI did not return structured location data");
    }

    const locationData = JSON.parse(toolCall.function.arguments);

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
