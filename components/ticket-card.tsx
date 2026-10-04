"use client";

import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import type { Registrant } from "@/lib/registrants";

type Props = {
  registrant: Registrant;
};

const QR_COLOR = { dark: "#0F0E0C", light: "#F4EEDF" };

function formatDate(ms: string) {
  return new Date(ms).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Potong teks agar muat di lebar maksimal yang diberikan canvas. */
function fitText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string {
  if (ctx.measureText(text).width <= maxWidth) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

export function TicketCard({ registrant }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [copied, setCopied] = useState(false);
  const [qrReady, setQrReady] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // QR ditampilkan di layar: bitmap 512px → tampil tajam, mengecil rapi di HP.
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    QRCode.toCanvas(c, registrant.qr_token, {
      width: 512,
      margin: 1,
      errorCorrectionLevel: "M",
      color: QR_COLOR,
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
      /* clipboard tidak tersedia — abaikan */
    }
  }

  function print() {
    if (typeof window !== "undefined") window.print();
  }

  /** Unduh tiket sebagai gambar PNG berisi QR + data peserta. */
  async function downloadTicket() {
    if (downloading) return;
    setDownloading(true);
    try {
      const qrDataUrl = await QRCode.toDataURL(registrant.qr_token, {
        width: 512,
        margin: 1,
        errorCorrectionLevel: "M",
        color: QR_COLOR,
      });
      const qrImg = new Image();
      await new Promise<void>((resolve, reject) => {
        qrImg.onload = () => resolve();
        qrImg.onerror = () => reject(new Error("QR gagal dimuat"));
        qrImg.src = qrDataUrl;
      });

      const W = 960;
      const H = 600;
      const c = document.createElement("canvas");
      c.width = W;
      c.height = H;
      const ctx = c.getContext("2d");
      if (!ctx) return;

      const INK = "#0F0E0C";
      const CREAM = "#F4EEDF";
      const LIME = "#C9F03A";

      // Latar + bingkai tebal gaya brutal.
      ctx.fillStyle = CREAM;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = LIME;
      ctx.fillRect(0, 0, W, 96);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 10;
      ctx.strokeRect(5, 5, W - 10, H - 10);
      ctx.beginPath();
      ctx.moveTo(5, 96);
      ctx.lineTo(W - 5, 96);
      ctx.stroke();

      // Header.
      ctx.fillStyle = INK;
      ctx.textBaseline = "middle";
      ctx.font = "700 34px 'Bricolage Grotesque', Arial, sans-serif";
      ctx.fillText("★ TIKET RESMI", 40, 50);
      ctx.textAlign = "right";
      ctx.font = "700 32px 'JetBrains Mono', monospace";
      ctx.fillText(registrant.registration_number, W - 40, 50);
      ctx.textAlign = "left";

      // Nama peserta (ukuran menyesuaikan agar tidak meluber).
      let nameSize = 62;
      ctx.font = `800 ${nameSize}px 'Bricolage Grotesque', Arial, sans-serif`;
      let name = registrant.name;
      const nameMax = W - 400;
      while (nameSize > 30 && ctx.measureText(name).width > nameMax) {
        nameSize -= 4;
        ctx.font = `800 ${nameSize}px 'Bricolage Grotesque', Arial, sans-serif`;
      }
      ctx.fillText(fitText(ctx, name, nameMax), 40, 170);

      // Data peserta.
      const rows: Array<[string, string]> = [
        ["EMAIL", registrant.email ?? "—"],
        ["TELP", registrant.phone],
        ["DAFTAR", formatDate(registrant.registered_at)],
      ];
      let y = 250;
      for (const [label, value] of rows) {
        ctx.fillStyle = "#6B675E";
        ctx.font = "700 20px Inter, Arial, sans-serif";
        ctx.fillText(label, 40, y);
        ctx.fillStyle = INK;
        ctx.font = "600 30px Inter, Arial, sans-serif";
        ctx.fillText(fitText(ctx, value, 480), 40, y + 36);
        y += 92;
      }

      // QR di kanan.
      const qrSize = 340;
      const qrX = W - qrSize - 44;
      const qrY = 150;
      ctx.fillStyle = CREAM;
      ctx.fillRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 8;
      ctx.strokeRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28);
      ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.font = "700 20px Inter, Arial, sans-serif";
      ctx.fillText("Scan sekali saat masuk", qrX + qrSize / 2, qrY + qrSize + 48);
      ctx.textAlign = "left";

      // Garis putus-putus + catatan kaki.
      ctx.setLineDash([14, 12]);
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(40, H - 92);
      ctx.lineTo(W - 40, H - 92);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.font = "700 26px Inter, Arial, sans-serif";
      ctx.fillText(
        "★ Tunjukkan QR ini saat check-in di meja registrasi.",
        40,
        H - 48
      );

      const blob = await new Promise<Blob | null>((resolve) =>
        c.toBlob(resolve, "image/png")
      );
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tiket-${registrant.registration_number}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      /* unduhan gagal — biarkan tombol kembali normal */
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article
      aria-label="Tiket digital"
      className="animate-stamp relative w-full max-w-md mx-auto"
    >
      <div className="brutal-card-lime relative overflow-hidden p-4 sm:p-6 md:p-7">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="brutal-tag border-ink bg-cream">Tiket Resmi</span>
          <span className="font-display text-[10px] font-bold uppercase tracking-widest sm:text-xs">
            ★ DPD Gelora Makassar 2026
          </span>
        </div>

        <h3 className="mt-4 font-display text-xl font-extrabold uppercase leading-tight break-words sm:text-2xl">
          {registrant.name}
        </h3>

        <div className="mt-4 inline-block max-w-full bg-cream px-3 py-2">
          <span className="block font-mono text-lg font-extrabold tracking-tight text-ink tabular-nums sm:text-2xl lg:text-3xl">
            {registrant.registration_number}
          </span>
        </div>

        <div className="mt-5 flex flex-col gap-4">
          <dl className="min-w-0 space-y-2 text-sm">
            <div className="flex flex-col gap-0.5">
              <dt className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Email
              </dt>
              <dd className="min-w-0 break-all font-medium text-ink">
                {registrant.email ?? "—"}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Telp
              </dt>
              <dd className="min-w-0 break-all font-medium text-ink tabular-nums">
                {registrant.phone}
              </dd>
            </div>
            <div className="flex flex-col gap-0.5">
              <dt className="font-display text-[10px] font-bold uppercase tracking-widest text-ink/60">
                Daftar
              </dt>
              <dd className="min-w-0 font-medium text-ink">
                {formatDate(registrant.registered_at)}
              </dd>
            </div>
          </dl>

          {/* QR: lebar mengikuti kolom, tinggi mengikuti rasio persegi. */}
          <div className="mx-auto w-full max-w-[15rem] shrink-0 rounded-md border-[3px] border-ink bg-cream p-2 shadow-brutal-sm">
            <div className="relative aspect-square w-full">
              <canvas
                ref={canvasRef}
                width={512}
                height={512}
                className="absolute inset-0 !h-full !w-full object-contain"
                aria-label={`QR ${registrant.registration_number}`}
              />
              {!qrReady && (
                <div className="absolute inset-0 grid place-items-center text-xs text-ink/40">
                  Membuat QR…
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-2 sm:grid sm:grid-cols-3">
          <button onClick={copy} className="brutal-btn-cobalt text-xs" type="button">
            {copied ? "✓ Tersalin" : "Salin Token QR"}
          </button>
          <button onClick={print} className="brutal-btn-ghost text-xs" type="button">
            Cetak Tiket
          </button>
          <button
            onClick={downloadTicket}
            disabled={downloading}
            className="brutal-btn-magenta text-xs"
            type="button"
          >
            {downloading ? "Menyiapkan..." : "Download Tiket"}
          </button>
        </div>

        <div className="mt-6 border-t-[3px] border-dashed border-ink pt-4">
          <p className="font-display text-[11px] font-bold uppercase tracking-wider text-ink/80 sm:text-xs">
            ★ Tunjukkan QR ini saat check-in di meja registrasi.
          </p>
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 px-2">
        <div className="h-1.5 w-3 rounded-r-full bg-ink" />
        <div className="perforation h-1.5 flex-1" />
        <div className="h-1.5 w-3 rounded-l-full bg-ink" />
      </div>

      <div className="brutal-card mt-3 flex items-center justify-between gap-2 p-3">
        <span className="font-display text-xs font-bold uppercase tracking-widest">
          Stub
        </span>
        <span className="font-mono text-xs tabular-nums">
          {registrant.registration_number}
        </span>
      </div>
    </article>
  );
}