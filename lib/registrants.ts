// Tipe dan helper yang dipakai lintas client & server.
// TIDAK ada state lokal — data asli ada di Supabase, diakses via API.

import { z } from "zod";

export type RegistrantStatus = "registered" | "checked_in";

export type Registrant = {
  id: string;
  event_id: string;
  name: string;
  email: string | null;
  phone: string;
  institution: string | null;
  registration_number: string;
  qr_token: string;
  status: RegistrantStatus;
  registered_at: string;
  checked_in_at: string | null;
};

export type Event = {
  id: string;
  name: string;
  slug: string;
  date: string | null;
  location: string | null;
  quota: number | null;
  created_at: string;
  title: string;
  title_accent: string;
  edition: string;
  tagline: string | null;
  ticket_prefix: string;
  hero_images: string[];
};

export const registrationSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Nama minimal 2 karakter")
    .max(80, "Nama terlalu panjang"),
  email: z
    .string()
    .trim()
    .email("Format email tidak valid"),
  phone: z
    .string()
    .trim()
    .min(8, "Nomor telepon minimal 8 digit")
    .max(20, "Nomor telepon terlalu panjang")
    .regex(/^[0-9+\s()-]+$/, "Nomor telepon mengandung karakter tidak valid"),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function nextSerialFor(existing: string[]): string {
  const prefix = "GBR-2026-";
  let max = 0;
  for (const r of existing) {
    const num = Number.parseInt(r.slice(prefix.length), 10);
    if (Number.isFinite(num) && num > max) max = num;
  }
  return `${prefix}${(max + 1).toString().padStart(4, "0")}`;
}