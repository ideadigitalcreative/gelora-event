import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import {
  nextSerialFor,
  registrationSchema,
} from "@/lib/registrants";

const bodySchema = registrationSchema.extend({
  event_id: z.string().uuid("Event tidak valid"),
  institution: z.string().trim().max(500).optional().nullable(),
});

export async function POST(request: NextRequest) {
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

  const supabase = createSupabaseServerClient();

  // Verifikasi event ada.
  const { data: event } = await supabase
    .from("events")
    .select("id, quota")
    .eq("id", parsed.data.event_id)
    .maybeSingle();
  if (!event) {
    return NextResponse.json({ error: "Event tidak ditemukan" }, { status: 404 });
  }

  // Cek kuota.
  if (typeof event.quota === "number" && event.quota > 0) {
    const { count } = await supabase
      .from("participants")
      .select("id", { count: "exact", head: true })
      .eq("event_id", event.id);
    if ((count ?? 0) >= event.quota) {
      return NextResponse.json(
        { error: "Kuota peserta untuk event ini sudah penuh." },
        { status: 409 }
      );
    }
  }

  // Generate serial unik (retry beberapa kali untuk menghindari tabrakan).
  const { data: existing } = await supabase
    .from("participants")
    .select("registration_number");
  const serials = (existing ?? []).map((r) => r.registration_number as string);
  let registrationNumber = nextSerialFor(serials);
  for (let i = 0; i < 5; i++) {
    const { data: collision } = await supabase
      .from("participants")
      .select("id")
      .eq("registration_number", registrationNumber)
      .maybeSingle();
    if (!collision) break;
    serials.push(registrationNumber);
    registrationNumber = nextSerialFor(serials);
  }

  const { data: inserted, error } = await supabase
    .from("participants")
    .insert({
      event_id: parsed.data.event_id,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone,
      institution: parsed.data.institution ?? null,
      registration_number: registrationNumber,
      status: "registered",
    })
    .select(
      "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
    )
    .single();

  if (error || !inserted) {
    if (error?.code === "23505") {
      return NextResponse.json(
        { error: "Nomor HP sudah terdaftar untuk event ini." },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: error?.message ?? "Gagal menyimpan peserta." },
      { status: 500 }
    );
  }

  return NextResponse.json({ participant: inserted });
}