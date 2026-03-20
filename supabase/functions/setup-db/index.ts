import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const dbUrl = Deno.env.get("SUPABASE_DB_URL");
    if (!dbUrl) throw new Error("SUPABASE_DB_URL not set");

    // Use postgres driver to run DDL — only available in Edge Function context
    const { Client } = await import("https://deno.land/x/postgres@v0.17.0/mod.ts");
    const client = new Client(dbUrl);
    await client.connect();

    await client.queryObject(`
      CREATE TABLE IF NOT EXISTS public.places (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        place_name TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'other',
        address TEXT,
        latitude DOUBLE PRECISION,
        longitude DOUBLE PRECISION,
        description TEXT,
        confidence TEXT DEFAULT 'medium',
        source_url TEXT,
        source_caption TEXT,
        source_username TEXT,
        platform TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.queryObject(`
      ALTER TABLE public.places ENABLE ROW LEVEL SECURITY;
    `);

    // Idempotent policy creation
    await client.queryObject(`
      DO $$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_policies
          WHERE tablename = 'places' AND policyname = 'Allow public read'
        ) THEN
          CREATE POLICY "Allow public read"  ON public.places FOR SELECT USING (true);
          CREATE POLICY "Allow public insert" ON public.places FOR INSERT WITH CHECK (true);
        END IF;
      END $$;
    `);

    // Reload PostgREST schema cache so the table is immediately visible
    await client.queryObject(`NOTIFY pgrst, 'reload schema';`);

    await client.end();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("setup-db error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
