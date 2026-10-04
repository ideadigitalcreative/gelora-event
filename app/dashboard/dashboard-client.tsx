"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Event, Registrant } from "@/lib/registrants";
import { EventSettings } from "./event-settings";

type Filter = "all" | "checked_in" | "registered";

function formatDateTime(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("id-ID", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Makassar",
  });
}

export function DashboardClient({
  initialEvents,
  initialParticipants,
  userEmail,
}: {
  initialEvents: Event[];
  initialParticipants: Record<string, Registrant[]>;
  userEmail: string | null;
}) {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [participants, setParticipants] = useState<Record<string, Registrant[]>>(
    initialParticipants
  );
  const [activeSlug, setActiveSlug] = useState<string>(
    initialEvents[0]?.slug ?? ""
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const activeEvent = events.find((e) => e.slug === activeSlug) ?? events[0];
  const list = activeEvent ? participants[activeEvent.slug] ?? [] : [];

  const reload = useCallback(async (slug: string, eventId: string) => {
    const supabase = createSupabaseBrowserClient();
    const { data } = await supabase
      .from("participants")
      .select(
        "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
      )
      .eq("event_id", eventId)
      .order("registered_at", { ascending: true });
    if (data) {
      setParticipants((prev) => ({
        ...prev,
        [slug]: data as Registrant[],
      }));
    }
  }, []);

  useEffect(() => {
    if (!activeEvent) return;
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`participants-${activeEvent.id}-${Date.now()}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "participants", filter: `event_id=eq.${activeEvent.id}` },
        () => reload(activeEvent.slug, activeEvent.id)
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeEvent, reload]);

  const stats = useMemo(() => {
    const total = list.length;
    const hadir = list.filter((r) => r.status === "checked_in").length;
    return {
      total,
      hadir,
      menunggu: total - hadir,
      pct: total === 0 ? 0 : Math.round((hadir / total) * 100),
    };
  }, [list]);

  const timeline = useMemo(() => {
    if (list.length === 0) return [] as Array<{ minute: string; count: number; ts: number }>;
    const checked = list.filter((r) => r.status === "checked_in" && r.checked_in_at);
    if (checked.length === 0) return [];
    const earliest = Math.min(...list.map((r) => Date.parse(r.registered_at)));
    const startMs = Math.floor(earliest / 60_000) * 60_000;
    const endMs = Math.ceil(Date.now() / 60_000) * 60_000;
    const buckets = new Map<number, number>();
    for (const r of checked) {
      const k = Math.floor(Date.parse(r.checked_in_at!) / 60_000) * 60_000;
      buckets.set(k, (buckets.get(k) ?? 0) + 1);
    }
    const out: Array<{ minute: string; count: number; ts: number }> = [];
    for (let t = startMs; t <= endMs; t += 60_000) {
      out.push({
        ts: t,
        minute: new Date(t).toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        count: buckets.get(t) ?? 0,
      });
    }
    return out;
  }, [list]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return list
      .filter((r) => (filter === "all" ? true : r.status === filter))
      .filter((r) =>
        q
          ? r.name.toLowerCase().includes(q) ||
            r.registration_number.toLowerCase().includes(q) ||
            (r.email ?? "").toLowerCase().includes(q) ||
            r.phone.includes(q)
          : true
      )
      .sort((a, b) => Date.parse(b.registered_at) - Date.parse(a.registered_at));
  }, [list, filter, query]);

  const peak = timeline.reduce((m, b) => Math.max(m, b.count), 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
      <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="brutal-tag bg-magenta text-cream">Live Dashboard</span>
          <h1 className="mt-3 font-display text-4xl font-extrabold uppercase leading-tight sm:text-6xl">
            Statistik
            <span className="text-cobalt"> Check-in</span>
          </h1>
          <p className="mt-2 max-w-xl text-ink/70">
            Login sebagai{" "}
            <span className="font-mono font-bold text-ink">{userEmail ?? "admin"}</span>.
            Data real-time dari Supabase; update seketika saat peserta baru
            mendaftar atau check-in.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="brutal-tag bg-lime text-xs">
            <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
            Live Sync
          </span>
          <form action="/api/logout" method="POST">
            <button type="submit" className="brutal-btn-ghost text-xs">
              Logout
            </button>
          </form>
        </div>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Terdaftar" value={stats.total} tone="cobalt" />
        <StatCard label="Sudah Hadir" value={stats.hadir} tone="lime" />
        <StatCard label="Menunggu" value={stats.menunggu} tone="tangerine" />
        <StatCard label="Kehadiran" value={stats.pct} suffix="%" tone="ink" />
      </section>

      <EventSettings
        event={activeEvent ?? null}
        onUpdated={(updated) =>
          setEvents((prev) => prev.map((e) => (e.id === updated.id ? updated : e)))
        }
      />

      <section className="brutal-card mt-8 p-5 sm:p-6">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <span className="brutal-tag bg-cream">Tren</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl">
              Check-in per Menit
            </h2>
            <p className="text-sm text-ink/60">
              {timeline.length} bucket · puncak {peak} orang / menit
            </p>
          </div>
          <span className="font-mono text-xs text-ink/50">HH:MM</span>
        </div>
        <div className="mt-6">
          {timeline.length === 0 ? (
            <div className="grid h-32 place-items-center rounded-md border-[3px] border-dashed border-ink/40 bg-cream2 text-sm text-ink/50">
              Belum ada data check-in.
            </div>
          ) : (
            <BarChart timeline={timeline} peak={peak} />
          )}
        </div>
      </section>

      <section className="brutal-card mt-8 overflow-hidden p-0">
        <div className="flex flex-col gap-3 border-b-[3px] border-ink bg-cream2 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="brutal-tag bg-cream">Daftar Peserta</span>
            <h2 className="mt-2 font-display text-2xl font-extrabold uppercase sm:text-3xl">
              Tabel Status
            </h2>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari nama / serial / email..."
              className="brutal-input w-full sm:w-72"
            />
            <div className="flex items-center gap-1 rounded-md border-[3px] border-ink bg-cream p-1">
              {(
                [
                  ["all", "Semua"],
                  ["checked_in", "Hadir"],
                  ["registered", "Menunggu"],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setFilter(k)}
                  className={`rounded-sm px-2.5 py-1 font-display text-xs font-bold uppercase tracking-wider transition ${
                    filter === k
                      ? "bg-ink text-cream"
                      : "bg-cream text-ink hover:bg-cream2"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {events.length > 1 && (
          <div className="border-b-[3px] border-ink bg-cream p-4">
            <label className="brutal-label">Pilih Event</label>
            <select
              className="brutal-input"
              value={activeEvent?.slug ?? ""}
              onChange={(e) => setActiveSlug(e.target.value)}
            >
              {events.map((ev) => (
                <option key={ev.id} value={ev.slug}>
                  {ev.name}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="bg-ink text-cream">
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Kode
                </th>
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Nama
                </th>
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Email
                </th>
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Telp
                </th>
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Check-in
                </th>
                <th className="px-4 py-3 text-left font-display text-[11px] font-bold uppercase tracking-widest">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-12 text-center text-sm text-ink/50"
                  >
                    Tidak ada peserta yang cocok.
                  </td>
                </tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-cream" : "bg-cream2"}>
                  <td className="px-4 py-3 font-mono text-sm font-bold text-ink">
                    {r.registration_number}
                  </td>
                  <td className="px-4 py-3 font-medium text-ink">{r.name}</td>
                  <td className="px-4 py-3 text-sm text-ink/80">{r.email ?? "—"}</td>
                  <td className="px-4 py-3 text-sm text-ink/80">{r.phone}</td>
                  <td className="px-4 py-3 text-sm text-ink/80">
                    {r.checked_in_at
                      ? new Date(r.checked_in_at).toLocaleTimeString("id-ID", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {r.status === "checked_in" ? (
                      <span className="brutal-tag border-ink bg-lime">Hadir</span>
                    ) : (
                      <span className="brutal-tag border-ink bg-cream">
                        Menunggu
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t-[3px] border-ink bg-cream2 px-4 py-3 text-xs">
          <span className="font-display font-bold uppercase tracking-widest">
            {filtered.length} Baris
          </span>
          <span className="font-mono text-ink/60">live sync via supabase realtime</span>
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  tone,
  suffix,
}: {
  label: string;
  value: number;
  tone: "lime" | "tangerine" | "cobalt" | "ink";
  suffix?: string;
}) {
  const bg =
    tone === "lime"
      ? "bg-lime"
      : tone === "tangerine"
        ? "bg-tangerine"
        : tone === "cobalt"
          ? "bg-cobalt text-cream"
          : "bg-cream";
  return (
    <div className={`brutal-card ${bg} p-4 sm:p-5`}>
      <div className="font-display text-[10px] font-bold uppercase tracking-[0.18em] opacity-80">
        {label}
      </div>
      <div className="mt-1 font-display text-3xl font-extrabold tabular-nums sm:text-4xl">
        {value.toLocaleString("id-ID")}
        {suffix ? <span className="ml-1 text-base font-bold opacity-70">{suffix}</span> : null}
      </div>
    </div>
  );
}

function BarChart({
  timeline,
  peak,
}: {
  timeline: Array<{ minute: string; count: number; ts: number }>;
  peak: number;
}) {
  const max = Math.max(1, peak);
  return (
    <div className="relative">
      <div className="flex h-44 items-end gap-1 overflow-x-auto">
        {timeline.map((b) => {
          const h = peak === 0 ? 0 : Math.max(4, (b.count / max) * 100);
          const tone =
            b.count === 0
              ? "bg-cream2 border-ink/20"
              : b.count === peak
                ? "bg-magenta border-ink"
                : "bg-cobalt border-ink";
          return (
            <div
              key={b.ts}
              className="group relative flex flex-1 min-w-[12px] flex-col items-center justify-end"
              title={`${b.minute} — ${b.count} check-in`}
            >
              <span className="absolute -top-5 hidden whitespace-nowrap rounded-sm border-[2px] border-ink bg-cream px-1.5 py-0.5 font-mono text-[10px] group-hover:block">
                {b.count}
              </span>
              <div
                style={{ height: `${h}%` }}
                className={`w-full border-[2px] ${tone} transition-all`}
              />
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-ink/60">
        <span>{timeline[0]?.minute}</span>
        <span>{timeline[timeline.length - 1]?.minute}</span>
      </div>
    </div>
  );
}