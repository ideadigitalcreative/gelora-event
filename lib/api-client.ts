// Client tipis untuk menarik data peserta event dari API.
// Digunakan oleh dashboard, scanner, dan form registrasi.

import type { Registrant } from "@/lib/registrants";

async function okOrThrow(res: Response) {
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `HTTP ${res.status}`);
  }
  return json;
}

export async function registerParticipant(payload: {
  event_id: string;
  name: string;
  email: string;
  phone: string;
  institution?: string | null;
}): Promise<Registrant> {
  const res = await fetch("/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await okOrThrow(res);
  return json.participant as Registrant;
}

export async function checkInByToken(qr_token: string): Promise<
  | { ok: true; is_new: boolean; registrant: Registrant }
  | { ok: false; reason: "duplicate" | "not_found"; registrant?: Registrant; serial?: string }
> {
  const res = await fetch("/api/checkin", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ qr_token }),
  });
  const json = await res.json();
  if (res.ok) return { ok: true, is_new: !!json.is_new, registrant: json.registrant };
  return { ok: false, reason: json.reason, registrant: json.registrant, serial: json.serial };
}