import { createSupabaseServerClient } from "@/lib/supabase-server";
import type { Event } from "@/lib/registrants";

const EVENT_COLUMNS =
  "id, name, slug, date, location, quota, created_at, title, title_accent, edition, tagline, ticket_prefix, hero_images";

export async function getDefaultEvent(): Promise<Event | null> {
  const supabase = createSupabaseServerClient();
  // Cari event aktif pertama (diurutkan dari yang terbaru).
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Event | null) ?? null;
}

export async function listEvents(): Promise<Event[]> {
  const supabase = createSupabaseServerClient();
  const { data } = await supabase
    .from("events")
    .select(EVENT_COLUMNS)
    .order("created_at", { ascending: false });
  return (data ?? []) as Event[];
}
