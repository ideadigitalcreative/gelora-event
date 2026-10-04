#!/usr/bin/env node
// Seed akun admin pertama lewat CLI.
// Cara pakai:
//   1. Taruh SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD di .env.local
//   2. Jalankan:  node scripts/seed-admin.mjs
//
// Atau pakai argumen:
//   node scripts/seed-admin.mjs panitia@gebrug.id password123 "Admin Panitia"

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// --- Load .env.local kalau ada (tanpa dependensi dotenv) ---
function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, "utf8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!(key in process.env)) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(__dirname, "..", ".env.local"));
loadEnvFile(resolve(__dirname, "..", ".env"));

// --- Resolve kredensial ---
const [, , cliEmail, cliPassword, cliName] = process.argv;
const email = (cliEmail ?? process.env.SEED_ADMIN_EMAIL ?? "").trim();
const password = cliPassword ?? process.env.SEED_ADMIN_PASSWORD ?? "";
const fullName = (cliName ?? process.env.SEED_ADMIN_NAME ?? "Admin Panitia").trim();

if (!email || !password) {
  console.error("\n✗ Email & password wajib diisi.\n");
  console.error("Cara pakai:");
  console.error("  1) node scripts/seed-admin.mjs panitia@gebrug.id password123");
  console.error("  2) atau set SEED_ADMIN_EMAIL & SEED_ADMIN_PASSWORD di .env.local");
  process.exit(1);
}
if (password.length < 8) {
  console.error("\n✗ Password minimal 8 karakter.\n");
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error(
    "\n✗ NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY belum di-set.\n"
  );
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("→ Mengecek jumlah admin...");
const { data: count, error: countErr } = await supabase.rpc("admin_count");
if (countErr) {
  console.error("✗ Gagal cek admin_count:", countErr.message);
  process.exit(1);
}
const total = Number(count ?? 0);
if (total > 0) {
  console.error(`✗ Sudah ada ${total} admin. Hentikan.`);
  console.error("  Hapus manual via Supabase Dashboard jika ingin re-seed.");
  process.exit(1);
}

console.log(`→ Membuat admin ${email}...`);
const { data, error } = await supabase.rpc("create_admin_user", {
  p_email: email,
  p_password: password,
  p_full_name: fullName,
});

if (error) {
  console.error("✗ Gagal:", error.message);
  process.exit(1);
}

console.log("\n✓ Akun admin berhasil dibuat.");
console.log("  ID    :", data.id);
console.log("  Email :", data.email);
console.log("  Created:", data.created);
console.log("\nSekarang login di /login dengan kredensial di atas.\n");
