import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  qr_token: z.string().trim().min(8, "QR token tidak valid"),
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
      { error: parsed.error.issues[0]?.message ?? "QR token tidak valid" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  const { data: participant } = await supabase
    .from("participants")
    .select(
      "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
    )
    .eq("qr_token", parsed.data.qr_token)
    .maybeSingle();

  if (!participant) {
    return NextResponse.json(
      { reason: "not_found", error: "Tiket tidak ditemukan" },
      { status: 404 }
    );
  }

  if (participant.status === "checked_in") {
    return NextResponse.json(
      { reason: "duplicate", registrant: participant, error: "Tiket sudah dipakai" },
      { status: 409 }
    );
  }

  // Atomic update + insert checkin record.
  const { data: updated, error } = await supabase
    .from("participants")
    .update({
      status: "checked_in",
      checked_in_at: new Date().toISOString(),
    })
    .eq("id", participant.id)
    .eq("status", "registered") // safety guard untuk double scan
    .select(
      "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
    )
    .single();

  if (error || !updated) {
    // Bisa jadi karena race; treat sebagai duplicate.
    const { data: fresh } = await supabase
      .from("participants")
      .select(
        "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
      )
      .eq("id", participant.id)
      .single();
    return NextResponse.json(
      {
        reason: "duplicate",
        registrant: fresh ?? participant,
        error: "Tiket sudah dipakai",
      },
      { status: 409 }
    );
  }

  await supabase.from("checkins").insert({
    participant_id: updated.id,
    checked_in_at: updated.checked_in_at,
  });

  return NextResponse.json({ registrant: updated, is_new: true });
}