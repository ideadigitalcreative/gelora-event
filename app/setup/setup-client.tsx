"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SetupClient() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("Admin Panitia");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    email: string;
    created: boolean;
  } | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/seed-admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          password,
          full_name: fullName.trim() || "Admin Panitia",
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal membuat akun admin.");
        return;
      }
      setSuccess({ email: json.admin.email, created: !!json.admin.created });
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="brutal-card-lime relative overflow-hidden p-6 sm:p-8">
          <span className="brutal-tag border-ink bg-cream">
            {success.created ? "Berhasil" : "Info"}
          </span>
          <h1 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight">
            {success.created ? "Admin Sudah Dibuat" : "Admin Sudah Ada"}
          </h1>
          <p className="mt-3 text-ink/80">
            Akun panitia:{" "}
            <span className="font-mono font-bold text-ink">{success.email}</span>
          </p>
          <p className="mt-2 text-sm text-ink/70">
            {success.created
              ? "Simpan password di tempat aman. Anda bisa masuk dengan email & password di halaman login."
              : "Email yang Anda masukkan sudah terdaftar di sistem."}
          </p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <a href="/login" className="brutal-btn-magenta text-base">
              Lanjut ke Login
              <span aria-hidden>→</span>
            </a>
            <button
              type="button"
              onClick={() => router.refresh()}
              className="brutal-btn-ghost text-sm"
            >
              Refresh Status
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="brutal-card relative p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <span className="brutal-tag bg-magenta text-cream">
            Setup Pertama
          </span>
          <span className="font-mono text-xs text-ink/50">/setup</span>
        </div>
        <h1 className="mt-4 font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
          Buat Akun
          <span className="text-cobalt"> Panitia.</span>
        </h1>
        <p className="mt-2 text-sm text-ink/70">
          Halaman ini hanya bisa dipakai kalau belum ada akun admin. Setelah
          akun pertama dibuat, halaman ini akan terkunci otomatis.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-4" noValidate>
          <div>
            <label className="brutal-label">Nama Lengkap</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Admin Panitia"
              autoComplete="name"
              className="brutal-input"
            />
          </div>
          <div>
            <label className="brutal-label">Email Admin</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="panitia@gebrug.id"
              autoComplete="email"
              className="brutal-input"
            />
          </div>
          <div>
            <label className="brutal-label">Kata Sandi (min. 8 karakter)</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              autoComplete="new-password"
              minLength={8}
              className="brutal-input"
            />
            <p className="mt-2 text-xs text-ink/50">
              Disimpan sebagai hash bcrypt di tabel auth.users Supabase.
            </p>
          </div>

          {error && (
            <p className="inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
              ⚠ {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !email || password.length < 8}
            className="brutal-btn-magenta w-full text-base"
          >
            {loading ? "Membuat akun..." : "Buat Akun & Aktifkan"}
            <span aria-hidden>→</span>
          </button>
        </form>

        <div className="mt-6 border-t-[3px] border-dashed border-ink/40 pt-4 text-xs text-ink/60">
          Akun ini akan dipakai untuk login di{" "}
          <a href="/login" className="font-mono underline">
            /login
          </a>{" "}
          dan mengakses dashboard & scanner.
        </div>
      </div>
    </div>
  );
}