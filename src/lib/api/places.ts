import { supabase } from "@/integrations/supabase/client";

export interface SavedPlace {
  id: string;
  place_name: string;
  category: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  description: string | null;
  confidence: string | null;
  source_url: string | null;
  source_caption: string | null;
  source_username: string | null;
  platform: string | null;
  created_at: string;
}

export interface PlaceInsert {
  place_name: string;
  category: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  description?: string;
  confidence?: string;
  source_url?: string;
  source_caption?: string;
  source_username?: string;
  platform?: string;
}

const SCHEMA_CACHE_ERROR = "schema cache";

/** Calls the setup-db edge function to create the places table if missing. */
async function ensurePlacesTable(): Promise<void> {
  const { error } = await supabase.functions.invoke("setup-db");
  if (error) console.warn("setup-db:", error.message);
}

export async function savePlaces(places: PlaceInsert[]): Promise<SavedPlace[]> {
  const attempt = async () =>
    supabase.from("places").insert(places).select();

  let { data, error } = await attempt();

  // If the table doesn't exist yet, create it then retry once
  if (error?.message?.toLowerCase().includes(SCHEMA_CACHE_ERROR)) {
    await ensurePlacesTable();
    ({ data, error } = await attempt());
  }

  if (error) throw new Error(error.message);
  return (data as SavedPlace[]) || [];
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const { data, error } = await supabase
    .from("places")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    // Table doesn't exist yet — return empty list gracefully
    if (error.message?.toLowerCase().includes(SCHEMA_CACHE_ERROR)) return [];
    throw new Error(error.message);
  }
  return (data as SavedPlace[]) || [];
}
