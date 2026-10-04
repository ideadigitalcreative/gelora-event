"use client";

import { useEffect, useState, useRef } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import { checkInByToken } from "@/lib/api-client";
import { Html5QrcodeScanner } from "html5-qrcode";
import confetti from "canvas-confetti";

type Status =
  | { kind: "success"; registrant: { name: string; registration_number: string } }
  | { kind: "duplicate"; registrant: { name: string; registration_number: string } }
  | { kind: "not_found"; serial: string };

const HISTORY_LIMIT = 5;

export function ScannerClient({ userEmail }: { userEmail: string | null }) {
  const [serial, setSerial] = useState("");
  const [scanning, setScanning] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);
  const [stats, setStats] = useState({ hadir: 0, menunggu: 0, total: 0 });
  const [history, setHistory] = useState<Array<{ key: string; label: string; tone: "lime" | "tangerine" | "cobalt"; ts: number }>>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  async function loadStats() {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("participants")
      .select("status", { count: "exact" });
    const total = data?.length ?? 0;
    const hadir = (data ?? []).filter((r) => r.status === "checked_in").length;
    setStats({ hadir, menunggu: total - hadir, total });
  }

  useEffect(() => {
    loadStats();
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`scan-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants" },
        () => loadStats()
      )
      .subscribe();

    if (!scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        "qr-reader",
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );
      scannerRef.current.render(onScanSuccess, onScanFailure);
    }

    return () => {
      supabase.removeChannel(channel);
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error);
        scannerRef.current = null;
      }
    };
  }, []);

  // Use a ref to keep track of the last scanned code and scanning state 
  // so we don't trigger multiple submissions for the same QR
  const lastScannedRef = useRef<string>("");
  const isScanningRef = useRef<boolean>(false);

  function onScanSuccess(decodedText: string) {
    if (isScanningRef.current) return;
    if (lastScannedRef.current === decodedText) return; // Prevent double scan
    
    lastScannedRef.current = decodedText;
    setSerial(decodedText);
    
    // Simulate form submission
    handleScan(decodedText);
  }

  function onScanFailure(error: any) {
    // Ignore frequent errors like "QR code not found"
  }

  async function handleScan(token: string) {
    if (!token) return;
    isScanningRef.current = true;
    setStatus(null);
    setScanning(true);
    try {
      const result = await checkInByToken(token);
      let entry: { key: string; label: string; tone: "lime" | "tangerine" | "cobalt"; ts: number } | null = null;
      if (result.ok) {
        setStatus({
          kind: "success",
          registrant: {
            name: result.registrant.name,
            registration_number: result.registrant.registration_number,
          },
        });
        entry = {
          key: `${result.registrant.id}-${Date.now()}`,
          label: `${result.registrant.registration_number} — ${result.registrant.name}`,
          tone: "lime",
          ts: Date.now(),
        };
      } else if (result.reason === "duplicate" && result.registrant) {
        setStatus({
          kind: "duplicate",
          registrant: {
            name: result.registrant.name,
            registration_number: result.registrant.registration_number,
          },
        });
        entry = {
          key: `${result.registrant.id}-${Date.now()}-dup`,
          label: `${result.registrant.registration_number} — Sudah dipakai`,
          tone: "tangerine",
          ts: Date.now(),
        };
      } else {
        setStatus({ kind: "not_found", serial: result.serial ?? token });
        entry = {
          key: `${token}-${Date.now()}-nf`,
          label: `${token} — Tidak terdaftar`,
          tone: "cobalt",
          ts: Date.now(),
        };
      }
      if (entry) {
        setHistory((prev) => [entry!, ...prev].slice(0, HISTORY_LIMIT));
      }
      setSerial("");
    } finally {
      setScanning(false);
      isScanningRef.current = false;
      // Reset last scanned after a delay so it can be scanned again if needed
      setTimeout(() => {
        lastScannedRef.current = "";
      }, 3000);
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    handleScan(serial.trim());
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-16">
      <header className="mb-8 grid gap-2 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="brutal-tag border-ink bg-magenta text-cream">
              Meja Check-in
            </span>
            {userEmail && (
              <span className="brutal-tag border-ink bg-cream">
                Petugas: {userEmail}
              </span>
            )}
          </div>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-[0.95] sm:text-6xl">
            Scan<span className="text-cobalt">.</span>
            Masuk<span className="text-magenta">.</span>
            Gas<span className="text-ink">.</span>
          </h1>
          <p className="mt-3 max-w-xl text-ink/70">
            Tempel / masukkan token QR peserta. Tiket hanya valid satu kali —
            duplikat langsung ditolak.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-2 lg:col-span-4 lg:gap-3">
          <Stat label="Hadir" value={stats.hadir} tone="lime" />
          <Stat label="Menunggu" value={stats.menunggu} tone="tangerine" />
          <Stat label="Total" value={stats.total} tone="cobalt" />
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="lg:col-span-7">
          <div className="brutal-card relative overflow-hidden p-4 sm:p-6">
            <div className="relative aspect-square w-full overflow-hidden rounded-md border-[3px] border-ink bg-ink">
              <div id="qr-reader" className="absolute inset-0 w-full h-full bg-ink [&_video]:object-cover [&_video]:w-full [&_video]:h-full"></div>
              {/* Optional styling untuk mempercantik UI html5-qrcode bawaan */}
              <style jsx global>{`
                #qr-reader {
                  border: none !important;
                }
                #qr-reader__scan_region {
                  background-color: transparent !important;
                }
                #qr-reader__dashboard_section_csr button,
                #qr-reader__dashboard_section_swaplink {
                  background-color: #C9F03A !important;
                  border: 3px solid #0F0E0C !important;
                  color: #0F0E0C !important;
                  font-weight: bold;
                  padding: 6px 12px;
                  border-radius: 4px;
                  box-shadow: 2px 2px 0px 0px #0F0E0C;
                  margin: 4px;
                  text-decoration: none;
                }
                #qr-reader__dashboard_section_csr button:active {
                  box-shadow: 0px 0px 0px 0px #0F0E0C;
                  transform: translate(2px, 2px);
                }
              `}</style>
              
              <CornerMark className="left-3 top-3 z-10" />
              <CornerMark className="right-3 top-3 rotate-90 z-10" />
              <CornerMark className="bottom-3 left-3 -rotate-90 z-10" />
              <CornerMark className="bottom-3 right-3 rotate-180 z-10" />

              <div
                className={`absolute inset-x-0 z-10 ${
                  scanning ? "animate-sweep" : "opacity-60 hidden"
                } pointer-events-none`}
              >
                <div className="mx-3 h-1 bg-magenta shadow-[0_0_12px_4px_rgba(255,46,126,0.55)]" />
              </div>
            </div>

            <form onSubmit={submit} className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <input
                value={serial}
                onChange={(e) => setSerial(e.target.value)}
                placeholder="Tempel / ketik token QR peserta"
                className="brutal-input font-mono text-base tracking-wider"
                autoFocus
                disabled={scanning}
              />
              <button
                type="submit"
                disabled={scanning || !serial.trim()}
                className="brutal-btn-magenta text-sm sm:text-base"
              >
                {scanning ? "Memindai..." : "Submit"}
              </button>
            </form>

            {status && <ResultBanner status={status} />}
          </div>
        </section>

        <aside className="lg:col-span-5">
          <div className="brutal-card p-5">
            <div className="flex items-center justify-between">
              <span className="brutal-tag bg-cream">Riwayat</span>
              <span className="font-mono text-xs text-ink/50">{history.length}/{HISTORY_LIMIT}</span>
            </div>
            <h2 className="mt-3 font-display text-2xl font-extrabold uppercase">
              {HISTORY_LIMIT} Scan Terakhir
            </h2>
            <ul className="mt-4 space-y-2">
              {history.length === 0 && (
                <li className="rounded-md border-[3px] border-dashed border-ink/40 bg-cream p-4 text-center text-sm text-ink/50">
                  Belum ada scan sesi ini.
                </li>
              )}
              {history.map((h) => (
                <li
                  key={h.key}
                  className={`animate-rise flex items-center justify-between gap-3 rounded-md border-[3px] border-ink p-3 ${
                    h.tone === "lime"
                      ? "bg-lime"
                      : h.tone === "tangerine"
                        ? "bg-tangerine"
                        : "bg-cobalt text-cream"
                  }`}
                >
                  <div className="min-w-0">
                    <div className="font-mono text-xs font-bold">{h.label}</div>
                    <div className="text-[11px] uppercase tracking-wider opacity-80">
                      {new Date(h.ts).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                  </div>
                  <span
                    className={`brutal-tag ${
                      h.tone === "lime"
                        ? "bg-cream"
                        : h.tone === "tangerine"
                          ? "bg-cream"
                          : "bg-cream text-ink"
                    }`}
                  >
                    {h.tone === "lime" ? "OK" : h.tone === "tangerine" ? "DUPLIKAT" : "INVALID"}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 border-t-[3px] border-dashed border-ink/40 pt-4 text-xs text-ink/60">
              Riwayat mengikuti sesi browser ini. Buka tab lain untuk simulasi
              lintas panitia.
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "lime" | "tangerine" | "cobalt";
}) {
  const bg =
    tone === "lime"
      ? "bg-lime"
      : tone === "tangerine"
        ? "bg-tangerine"
        : "bg-cobalt text-cream";
  return (
    <div className={`brutal-card ${bg} px-2 py-2 sm:px-3 sm:py-3`}>
      <div className="font-display text-[10px] font-bold uppercase tracking-widest opacity-80">
        {label}
      </div>
      <div className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
        {value.toLocaleString("id-ID")}
      </div>
    </div>
  );
}

function CornerMark({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      className={`absolute h-7 w-7 ${className}`}
      fill="none"
      aria-hidden
    >
      <path d="M2 10V2h8" stroke="#C9F03A" strokeWidth="3" strokeLinecap="square" />
    </svg>
  );
}

function ResultBanner({ status }: { status: Status }) {
  if (status.kind === "success") {
    return (
      <div className="animate-stamp mt-5 border-[3px] border-ink bg-lime p-5 shadow-brutal">
        <div className="flex items-center justify-between">
          <span className="brutal-tag border-ink bg-cream">Berhasil</span>
          <span className="font-display text-xs font-bold uppercase tracking-widest text-ink">
            Status: Check-in
          </span>
        </div>
        <h3 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight">
          Check-in Berhasil
        </h3>
        <p className="mt-1 font-mono text-lg font-bold">{status.registrant.registration_number}</p>
        <p className="text-base font-medium">{status.registrant.name}</p>
      </div>
    );
  }
  if (status.kind === "duplicate") {
    return (
      <div className="animate-shake mt-5 border-[3px] border-ink bg-tangerine p-5 shadow-brutal-tangerine">
        <div className="flex items-center justify-between">
          <span className="brutal-tag border-ink bg-cream">Ditolak</span>
          <span className="font-display text-xs font-bold uppercase tracking-widest text-ink">
            Status: Duplikat
          </span>
        </div>
        <h3 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight">
          Tiket Ini Sudah Dipakai
        </h3>
        <p className="mt-1 font-mono text-lg font-bold">{status.registrant.registration_number}</p>
        <p className="text-base font-medium">{status.registrant.name}</p>
      </div>
    );
  }
  return (
    <div className="animate-shake mt-5 border-[3px] border-ink bg-cobalt p-5 text-cream shadow-brutal-cobalt">
      <div className="flex items-center justify-between">
        <span className="brutal-tag border-cream bg-cream text-ink">Invalid</span>
        <span className="font-display text-xs font-bold uppercase tracking-widest">
          Status: Tidak Ditemukan
        </span>
      </div>
      <h3 className="mt-3 font-display text-3xl font-extrabold uppercase leading-tight">
        Token Tidak Terdaftar
      </h3>
      <p className="mt-1 font-mono text-lg font-bold">{status.serial}</p>
      <p className="text-base">Periksa kembali atau minta peserta mendaftar ulang.</p>
    </div>
  );
}