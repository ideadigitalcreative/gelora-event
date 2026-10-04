"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Registrant } from "@/lib/registrants";

type Props = {
  registrant: Registrant;
};

function formatDate(ms: string) {
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function TicketCard({ registrant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    QRCode.toCanvas(c, registrant.qr_token, {
      width: 320,
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#0F0E0C", light: "#F4EEDF" },
    })
      .then(() => setQrReady(true))
      .catch(() => setQrReady(false));
  }, [registrant.qr_token]);

  async function copy() {
    try {
      await navigator.clipboard.writeText(registrant.qr_token);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  }

  function print() {
    if (typeof window !== "undefined") window.print();
  }

  return (
    <article aria-label="Tiket digital" className="animate-stamp relative">
      <div className="brutal-card-lime relative overflow-hidden p-6 sm:p-7">
        <div className="flex items-center justify-between">
          <span className="brutal-tag border-ink bg-cream">Tiket Resmi</span>
          <span className="font-display text-xs font-bold uppercase tracking-widest">
            ★ DPD Gelora Makassar 2026
          </span>
        </div>

        <h3 className="mt-4 font-display text-2xl font-extrabold uppercase leading-tight">
          {registrant.name}
        </h3>

        <div className="mt-5 inline-block bg-cream px-3 py-2">
          <span className="font-mono text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {registrant.registration_number}
          </span>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
          <dl className="space-y-1.5 text-sm">
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Email
              </span>
              <span className="font-medium text-ink">{registrant.email ?? "—"}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Telp
              </span>
              <span className="font-medium text-ink">{registrant.phone}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Daftar
              </span>
              <span className="font-medium text-ink">{formatDate(registrant.registered_at)}</span>
            </div>
          </dl>

          <div className="mx-auto w-fit rounded-md border-[3px] border-ink bg-cream p-2 shadow-brutal-sm">
            <canvas
              ref={canvasRef}
              width={160}
              height={160}
              className="h-32 w-32 sm:h-40 sm:w-40"
              aria-label={`QR ${registrant.registration_number}`}
            />
            {!qrReady && (
              <div className="grid h-40 w-40 place-items-center text-xs text-ink/40">
                ...
              </div>
            )}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button onClick={copy} className="brutal-btn-cobalt text-xs">
            {copied ? "✓ Tersalin" : "Salin Token QR"}
          </button>
          <button onClick={print} className="brutal-btn-ghost text-xs">
            Cetak Tiket
          </button>
        </div>

        <div className="mt-6 border-t-[3px] border-dashed border-ink pt-4">
          <p className="font-display text-xs font-bold uppercase tracking-wider text-ink/80">
            ★ Tunjukkan QR ini saat check-in di meja registrasi.
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 px-2">
        <div className="h-1.5 w-3 rounded-r-full bg-ink" />
        <div className="perforation h-1.5 flex-1" />
        <div className="h-1.5 w-3 rounded-l-full bg-ink" />
      </div>

      <div className="brutal-card mt-3 flex items-center justify-between p-3">
        <span className="font-display text-xs font-bold uppercase tracking-widest">
          Stub
        </span>
        <span className="font-mono text-xs">{registrant.registration_number}</span>
      </div>
    </article>
  );
}