import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SetupClient } from "./setup-client";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Setup Admin — GELORA EVENT",
  description: "Buat akun panitia pertama untuk mengelola event.",
};

export default async function SetupPage() {
  const supabase = createSupabaseServerClient();

  // Cek apakah sudah ada admin. Jika ada, redirect ke /login.
  const { data, error } = await supabase.rpc("admin_count");
  const adminCount = Number(data ?? 0);

  if (!error && adminCount > 0) {
    // Sudah ada admin, kunci halaman setup.
    return <AlreadySetupNotice />;
  }

  return <SetupClient />;
}

function AlreadySetupNotice() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="brutal-card p-6 sm:p-8">
        <span className="brutal-tag bg-cobalt text-cream">Terkunci</span>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-tight">
          Setup Sudah Selesai
        </h1>
        <p className="mt-3 text-ink/70">
          Akun admin sudah pernah dibuat. Halaman ini hanya untuk inisialisasi
          pertama kali. Silakan login untuk mengakses dashboard.
        </p>
        <a href="/login" className="brutal-btn-magenta mt-6 inline-flex text-base">
          Ke Halaman Login
          <span aria-hidden>→</span>
        </a>
      </div>
    </div>
  );
}