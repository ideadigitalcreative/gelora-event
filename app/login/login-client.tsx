"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function LoginClient({ needsSetup }: { needsSetup: boolean }) {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) {
        setError(
          error.message === "Invalid login credentials"
            ? "Email atau kata sandi salah."
            : error.message
        );
        return;
      }
      router.replace(next);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative grid min-h-[calc(100dvh-3.5rem)] place-items-center overflow-hidden bg-cream px-4 py-10 sm:px-6">
      <div className="absolute -left-10 top-10 h-24 w-24 rotate-[-6deg] brutal-card-magenta hidden sm:block" />
      <div className="absolute -right-8 bottom-12 h-28 w-28 rotate-[8deg] brutal-card-lime hidden sm:block" />

      <form
        onSubmit={submit}
        className="brutal-card relative z-10 w-full max-w-md p-6 sm:p-8"
        noValidate
      >
        <div className="flex items-center justify-between">
          <span className="brutal-tag bg-magenta text-cream">Akses Panitia</span>
          <span className="font-mono text-xs text-ink/50">/login</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
          Masuk
          <span className="text-cobalt">.</span>
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Hanya panitia yang punya akun. Peserta tidak perlu login — cukup
          gunakan halaman beranda untuk mendapat tiket.
        </p>

        <div className="mt-6 space-y-4">
          <div>
            <label className="brutal-label">Email Admin</label>
            <input
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="panitia@gebrug.id"
              className="brutal-input"
            />
          </div>
          <div>
            <label className="brutal-label">Kata Sandi</label>
            <input
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="brutal-input"
            />
          </div>

          {error && (
            <p className="inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="brutal-btn-magenta w-full text-base"
          >
            {loading ? "Memverifikasi..." : "Masuk Dashboard"}
            <span aria-hidden>→</span>
          </button>
        </div>

        <div className="mt-6 border-t-[3px] border-dashed border-ink/40 pt-4 text-xs text-ink/60">
          {needsSetup ? (
            <>
              Belum ada akun panitia?{" "}
              <a href="/setup" className="font-mono font-bold text-magenta underline">
                Buat admin pertama di /setup
              </a>
              .
            </>
          ) : (
            <>
              Belum punya akun? Minta admin membuatkan lewat{" "}
              <span className="font-mono">Supabase Dashboard → Authentication → Users</span>.
            </>
          )}
        </div>
      </form>
    </div>
  );
}