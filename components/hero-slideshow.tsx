"use client";

import { useCallback, useEffect, useState } from "react";

// Slider foto tunggal berformat A4 (210 × 297 mm) → rasio 1 / √2 ≈ 0.7071.
const A4_ASPECT = "1 / 1.4142";

/**
 * Slider satu foto besar untuk sisi kanan hero beranda.
 * Foto dikirim dari database (event.hero_images) dan bisa diganti di dashboard.
 * Jika belum ada foto, menampilkan kartu fallback gaya festival.
 */
export function HeroSlideshow({ images }: { images: string[] }) {
  const slides = (images ?? []).filter(Boolean);
  const [index, setIndex] = useState(0);

  // Batasi index jika daftar foto berkurang.
  useEffect(() => {
    if (index > slides.length - 1) setIndex(0);
  }, [slides.length, index]);

  const go = useCallback(
    (delta: number) => {
      if (slides.length < 2) return;
      setIndex((prev) => (prev + delta + slides.length) % slides.length);
    },
    [slides.length]
  );

  // Putar otomatis tiap 5 detik (hanya jika ada lebih dari satu foto).
  useEffect(() => {
    if (slides.length < 2) return;
    const id = setInterval(() => go(1), 5000);
    return () => clearInterval(id);
  }, [slides.length, go]);

  if (slides.length === 0) return <FallbackCard />;

  return (
    <div className="relative w-full max-w-md">
      <div className="brutal-card relative overflow-hidden border-ink bg-cream2 p-3">
        <div className="relative w-full overflow-hidden border-[3px] border-ink bg-cream" style={{ aspectRatio: A4_ASPECT }}>
          {/* Semua slide dirender, hanya yang aktif yang terlihat → transisi crossfade. */}
          {slides.map((src, i) => (
            <img
              key={src + i}
              src={src}
              alt={`Foto festival ${i + 1}`}
              loading={i === 0 ? "eager" : "lazy"}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                i === index ? "opacity-100" : "opacity-0"
              }`}
            />
          ))}

          {/* Lapisan label festival di atas foto. */}
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center justify-between bg-ink/85 px-3 py-2">
            <span className="font-display text-[11px] font-bold uppercase tracking-widest text-cream">
              ★ Festival Pass
            </span>
            <span className="font-mono text-[10px] text-lime">
              A4 · {String(index + 1).padStart(2, "0")}/
              {String(slides.length).padStart(2, "0")}
            </span>
          </div>
        </div>

        {/* Kontrol navigasi. */}
        {slides.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label="Foto sebelumnya"
              className="brutal-btn-ghost absolute left-5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center p-0 text-lg"
            >
              ‹
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label="Foto berikutnya"
              className="brutal-btn-ghost absolute right-5 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center p-0 text-lg"
            >
              ›
            </button>

            {/* Titik-titik posisi. */}
            <div className="mt-3 flex items-center justify-center gap-2">
              {slides.map((src, i) => (
                <button
                  key={`dot-${i}`}
                  type="button"
                  aria-label={`Tampilkan foto ${i + 1}`}
                  onClick={() => setIndex(i)}
                  className={`h-3 w-3 rounded-full border-2 border-ink transition ${
                    i === index ? "bg-magenta" : "bg-cream"
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Kartu tampilan awal ketika panitia belum mengunggah foto apa pun.
function FallbackCard() {
  return (
    <div className="brutal-card-magenta relative w-full max-w-md overflow-hidden p-6">
      <div className="flex items-center justify-between">
        <span className="font-display text-xs font-bold uppercase tracking-widest text-cream">
          ★ Festival Pass
        </span>
        <span className="font-mono text-xs text-cream/80">N° 0000 / 2026</span>
      </div>
      <h3 className="mt-8 font-display text-4xl font-extrabold uppercase leading-none tracking-tight">
        Tiket
        <br />
        Digital
      </h3>
      <p className="mt-4 font-body text-sm text-cream/90">
        Setiap tiket berisi kode QR unik yang hanya bisa dipakai satu kali saat
        check-in.
      </p>
      <div className="mt-6 border-t-[3px] border-dashed border-cream/40 pt-4">
        <div className="font-mono text-xs text-cream/70">GBR-2026-XXXX</div>
      </div>
    </div>
  );
}