import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  name: z.string().trim().min(2).max(160),
  date: z.string().trim().optional().nullable(),
  location: z.string().trim().max(300).optional().nullable(),
  quota: z.number().int().positive().optional().nullable(),
  title: z.string().trim().min(1).max(60).optional(),
  title_accent: z.string().trim().min(1).max(60).optional(),
  edition: z.string().trim().min(1).max(20).optional(),
  tagline: z.string().trim().max(400).optional().nullable(),
  ticket_prefix: z.string().trim().min(2).max(24).optional(),
});

// Field khusus endpoint update (PATCH).
const patchSchema = z.object({
  id: z.string().uuid("Event tidak valid"),
  name: z.string().trim().min(2).max(160).optional(),
  date: z.string().trim().nullable().optional(),
  location: z.string().trim().max(300).nullable().optional(),
  quota: z.number().int().positive().nullable().optional(),
  title: z.string().trim().min(1).max(60).optional(),
  title_accent: z.string().trim().min(1).max(60).optional(),
  edition: z.string().trim().min(1).max(20).optional(),
  tagline: z.string().trim().max(400).nullable().optional(),
  ticket_prefix: z.string().trim().min(2).max(24).optional(),
  hero_images: z
    .array(z.string().trim().url("URL foto tidak valid").max(2048))
    .max(12, "Maksimal 12 foto")
    .optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || `event-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak berhak" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  let slug = slugify(parsed.data.name);
  for (let i = 0; i < 5; i++) {
    const { data: collision } = await supabase
      .from("events")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    if (!collision) break;
    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      name: parsed.data.name,
      slug,
      date: parsed.data.date ? new Date(parsed.data.date).toISOString() : null,
      location: parsed.data.location ?? null,
      quota: parsed.data.quota ?? null,
      title: parsed.data.title ?? "GELORA",
      title_accent: parsed.data.title_accent ?? "EVENT",
      edition: parsed.data.edition ?? "2026",
      tagline: parsed.data.tagline ?? null,
      ticket_prefix: parsed.data.ticket_prefix ?? "GBR-2026",
    })
    .select("id, name, slug, date, location, quota, created_at, title, title_accent, edition, tagline, ticket_prefix")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Gagal membuat event." },
      { status: 500 }
    );
  }
  return NextResponse.json({ event: data });
}

export async function PATCH(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Tidak berhak" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const parsed = patchSchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const { id, ...fields } = parsed.data;
  const update: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) continue;
    if (key === "date") {
      update[key] = value && typeof value === "string"
        ? new Date(value).toISOString()
        : value;
    } else {
      update[key] = value;
    }
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada perubahan untuk disimpan." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("events")
    .update(update)
    .eq("id", id)
    .select(
      "id, name, slug, date, location, quota, created_at, title, title_accent, edition, tagline, ticket_prefix, hero_images"
    )
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Gagal memperbarui event." },
      { status: 500 }
    );
  }
  return NextResponse.json({ event: data });
}