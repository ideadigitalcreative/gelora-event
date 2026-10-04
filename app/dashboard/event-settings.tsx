"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { Event } from "@/lib/registrants";

type FormState = {
  title: string;
  title_accent: string;
  edition: string;
  tagline: string;
  ticket_prefix: string;
  name: string;
  date: string;
  location: string;
  quota: string;
};

function toForm(ev: Event): FormState {
  const dateValue = ev.date
    ? new Date(ev.date).toISOString().slice(0, 10)
    : "";
  return {
    title: ev.title ?? "GELORA",
    title_accent: ev.title_accent ?? "EVENT",
    edition: ev.edition ?? "2026",
    tagline: ev.tagline ?? "",
    ticket_prefix: ev.ticket_prefix ?? "GBR-2026",
    name: ev.name,
    date: dateValue,
    location: ev.location ?? "",
    quota: ev.quota != null ? String(ev.quota) : "",
  };
}

export function EventSettings({
  event,
  onUpdated,
}: {
  event: Event | null;
  onUpdated: (event: Event) => void;
}) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(() =>
    event
      ? toForm(event)
      : {
          title: "GELORA",
          title_accent: "EVENT",
          edition: "2026",
          tagline: "",
          ticket_prefix: "GBR-2026",
          name: "",
          date: "",
          location: "",
          quota: "",
        }
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  // Slider foto hero (A4) — disimpan terpisah, langsung terkirim tiap perubahan.
  const [images, setImages] = useState<string[]>(event?.hero_images ?? []);
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState<string | null>(null);

  // Sinkronkan isian form saat event aktif berganti (mis. ganti pilihan event).
  useEffect(() => {
    if (event) {
      setForm(toForm(event));
      setImages(event.hero_images ?? []);
      setError(null);
      setOk(false);
      setImgError(null);
    }
  }, [event?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  async function saveImages(next: string[]) {
    const prev = images;
    setImages(next);
    setImgError(null);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: event!.id, hero_images: next }),
      });
      const json = await res.json();
      if (!res.ok) {
        setImages(prev);
        setImgError(json.error ?? "Gagal menyimpan foto.");
        return;
      }
      if (json.event) onUpdated(json.event as Event);
      router.refresh();
    } catch {
      setImages(prev);
      setImgError("Tidak bisa terhubung ke server.");
    }
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    setImgError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) {
          setImgError(json.error ?? "Gagal mengunggah foto.");
          break;
        }
        uploaded.push(json.url as string);
      }
      if (uploaded.length > 0) {
        await saveImages([...images, ...uploaded]);
      }
    } finally {
      setUploading(false);
    }
  }

  if (!event) {
    return (
      <section className="brutal-card mt-8 p-5 sm:p-6">
        <span className="brutal-tag bg-cream">Pengaturan</span>
        <h2 className="mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl">
          Belum Ada Event
        </h2>
        <p className="mt-2 text-sm text-ink/60">
          Buat event lewat <span className="font-mono">POST /api/events</span>{" "}
          atau tambahkan baris di tabel <span className="font-mono">events</span>{" "}
          via Supabase Dashboard.
        </p>
      </section>
    );
  }

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setOk(false);
    setError(null);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setOk(false);
    try {
      const res = await fetch("/api/events", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: event!.id,
          title: form.title.trim(),
          title_accent: form.title_accent.trim(),
          edition: form.edition.trim(),
          tagline: form.tagline.trim() || null,
          ticket_prefix: form.ticket_prefix.trim(),
          name: form.name.trim(),
          date: form.date ? `${form.date}T00:00:00` : null,
          location: form.location.trim() || null,
          quota: form.quota ? Number(form.quota) : null,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Gagal menyimpan perubahan.");
        return;
      }
      setOk(true);
      if (json.event) onUpdated(json.event as Event);
      router.refresh();
    } catch {
      setError("Tidak bisa terhubung ke server.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="brutal-card mt-8 p-5 sm:p-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="brutal-tag bg-cream">Pengaturan</span>
          <h2 className="mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl">
            Edit Tampilan Beranda
          </h2>
          <p className="text-sm text-ink/60">
            Bagian hero (judul, edisi, tagline, tiket) dan detail event.
          </p>
        </div>
        <span className="font-mono text-xs text-ink/50">{event.slug}</span>
      </div>

      <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="brutal-label">Judul Utama</label>
            <input
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              className="brutal-input"
              maxLength={60}
            />
            <p className="mt-1 text-xs text-ink/50">Contoh: GELORA</p>
          </div>
          <div>
            <label className="brutal-label">Judul Aksen</label>
            <input
              value={form.title_accent}
              onChange={(e) => set("title_accent", e.target.value)}
              className="brutal-input"
              maxLength={60}
            />
            <p className="mt-1 text-xs text-ink/50">Contoh: EVENT</p>
          </div>
          <div>
            <label className="brutal-label">Edisi</label>
            <input
              value={form.edition}
              onChange={(e) => set("edition", e.target.value)}
              className="brutal-input"
              maxLength={20}
            />
            <p className="mt-1 text-xs text-ink/50">Contoh: 2026</p>
          </div>
        </div>

        <div>
          <label className="brutal-label">Tagline / Deskripsi Singkat</label>
          <textarea
            value={form.tagline}
            onChange={(e) => set("tagline", e.target.value)}
            rows={3}
            maxLength={400}
            className="brutal-input resize-y"
            placeholder="Festival kreasi anak negeri — ..."
          />
          <p className="mt-1 text-right font-mono text-xs text-ink/50">
            {form.tagline.length}/400
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label className="brutal-label">Nama Event</label>
            <input
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="brutal-input"
              maxLength={160}
              required
            />
          </div>
          <div>
            <label className="brutal-label">Tanggal</label>
            <input
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              className="brutal-input"
            />
          </div>
          <div>
            <label className="brutal-label">Tempat</label>
            <input
              value={form.location}
              onChange={(e) => set("location", e.target.value)}
              className="brutal-input"
              maxLength={300}
              placeholder="Aula Utama, Makassar"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="brutal-label">Kuota (opsional)</label>
            <input
              type="number"
              min={1}
              value={form.quota}
              onChange={(e) => set("quota", e.target.value)}
              className="brutal-input"
              placeholder="1000"
            />
          </div>
          <div>
            <label className="brutal-label">Awalan Nomor Tiket</label>
            <input
              value={form.ticket_prefix}
              onChange={(e) => set("ticket_prefix", e.target.value)}
              className="brutal-input"
              maxLength={24}
              placeholder="GBR-2026"
            />
            <p className="mt-1 text-xs text-ink/50">
              Ditampilkan di kolom Tiket.
            </p>
          </div>
        </div>

        {/* ——— Slider Foto Hero (rasio A4) ——— */}
        <div className="border-t-[3px] border-ink pt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="brutal-label mb-0">
              Foto Slider Beranda · Rasio A4
            </label>
            <span className="font-mono text-xs text-ink/50">
              {images.length}/12 foto · JPG/PNG/WEBP · maks 3 MB
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-3">
            {images.length === 0 && (
              <div className="grid w-full place-items-center border-[3px] border-dashed border-ink/40 bg-cream2 px-4 py-8 text-center">
                <p className="text-sm text-ink/60">
                  Belum ada foto. Foto pertama akan tampil di sisi kanan beranda.
                </p>
              </div>
            )}
            {images.map((url, i) => (
              <figure
                key={url}
                className="relative w-28 border-[3px] border-ink bg-cream2 p-1 sm:w-32"
              >
                {/* Pratinjau memakai rasio A4 yang sama seperti di beranda. */}
                <div
                  className="w-full overflow-hidden border-2 border-ink bg-cream"
                  style={{ aspectRatio: "1 / 1.4142" }}
                >
                  <img
                    src={url}
                    alt={`Foto ${i + 1}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <figcaption className="mt-1 text-center font-mono text-[10px] text-ink/60">
                  {i === 0 ? "SAMPUL" : `KE-${i + 1}`}
                </figcaption>
                <button
                  type="button"
                  onClick={() => saveImages(images.filter((u) => u !== url))}
                  aria-label={`Hapus foto ${i + 1}`}
                  className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center border-2 border-ink bg-tangerine font-display text-xs font-bold leading-none text-ink shadow-brutal"
                >
                  ×
                </button>
              </figure>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <label className="brutal-btn-ghost cursor-pointer text-sm">
              {uploading ? "Mengunggah..." : "+ Tambah Foto"}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                multiple
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  void handleUpload(e.target.files);
                  e.target.value = "";
                }}
              />
            </label>
            <span className="text-xs text-ink/50">
              Rasio bingkai A4 (210×297 mm) — foto dipotong pas (cover).
            </span>
          </div>

          {imgError && (
            <p className="mt-3 inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
              ⚠ {imgError}
            </p>
          )}
        </div>

        {error && (
          <p className="inline-block rounded-sm border-2 border-ink bg-tangerine px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            ⚠ {error}
          </p>
        )}
        {ok && (
          <p className="inline-block rounded-sm border-2 border-ink bg-lime px-2 py-1 font-display text-[11px] font-bold uppercase tracking-wider text-ink">
            ✓ Tersimpan — beranda sudah diperbarui.
          </p>
        )}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="brutal-btn-magenta text-sm">
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
            <span aria-hidden>→</span>
          </button>
          <a href="/" target="_blank" className="brutal-btn-ghost text-sm">
            Lihat Beranda ↗
          </a>
        </div>
      </form>
    </section>
  );
}