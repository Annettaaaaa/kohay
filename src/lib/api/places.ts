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

export async function savePlaces(places: PlaceInsert[]): Promise<SavedPlace[]> {
  const { data, error } = await supabase
    .from("places" as any)
    .insert(places)
    .select();

  if (error) throw new Error(error.message);
  return (data as SavedPlace[]) || [];
}

export async function getSavedPlaces(): Promise<SavedPlace[]> {
  const { data, error } = await supabase
    .from("places" as any)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data as SavedPlace[]) || [];
}
