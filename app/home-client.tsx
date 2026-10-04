"use client";

import Link from "next/link";
import { RegistrationForm } from "@/components/registration-form";
import { TicketCard } from "@/components/ticket-card";
import { HeroSlideshow } from "@/components/hero-slideshow";
import type { Event, Registrant } from "@/lib/registrants";
import { useState } from "react";

export function HomeClient({ event }: { event: Event | null }) {
  const [ticket, setTicket] = useState<Registrant | null>(null);

  return (
    <>
      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden border-b-[3px] border-ink bg-cream">
        <div className="mx-auto max-w-7xl px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="animate-rise inline-flex items-center gap-2 rounded-sm border-[3px] border-ink bg-lime px-3 py-1.5 font-display text-xs font-bold uppercase tracking-[0.2em] shadow-brutal">
                <span className="h-2 w-2 animate-pulse rounded-full bg-ink" />
                Tiket Gelora Ideologisasi Pengurus DPD, DPC dan KADER 2026
              </div>

              <h1 className="animate-rise mt-6 font-display text-[18vw] font-extrabold leading-[0.85] tracking-tighter text-ink sm:text-7xl lg:text-[7.5rem] xl:text-[8rem]">
                {event?.title ?? "GELORA"}
                <br />
                <span className="relative inline-block text-magenta">
                  {event?.title_accent ?? "EVENT"}
                  <span className="stamp-circle absolute -right-6 -top-4 hidden lg:grid">
                    Edisi
                    <br />
                    {event?.edition ?? "2026"}
                  </span>
                </span>
                <span className="ml-2 text-ink">.</span>
              </h1>

              <p className="lead mt-6 max-w-xl text-lg font-medium text-ink/80">
                {event?.tagline ??
                  "Festival kreasi anak negeri — tiga panggung, satu malam, tak terlupakan. Daftarkan dirimu, simpan QR, tunjukkan saat masuk."}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="#daftar" className="brutal-btn-magenta text-base sm:text-lg">
                  Ambil Tiketku
                  <span aria-hidden>↓</span>
                </a>
                <Link href="/dashboard" className="brutal-btn-ghost text-base">
                  Lihat Statistik
                </Link>
              </div>

              <dl className="mt-10 grid grid-cols-3 gap-2 border-y-[3px] border-ink py-4 sm:gap-6">
                <div className="border-r-[3px] border-ink pr-2 sm:pr-6">
                  <dt className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
                    Hari
                  </dt>
                  <dd className="font-display text-base font-bold uppercase sm:text-lg">
                    {event?.date
                      ? new Date(event.date).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "04 Okt 2026"}
                  </dd>
                </div>
                <div className="border-r-[3px] border-ink pr-2 sm:pr-6">
                  <dt className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
                    Tempat
                  </dt>
                  <dd className="font-display text-base font-bold uppercase sm:text-lg">
                    {event?.location ? event.location.split(",")[0] : "Makassar"}
                  </dd>
                </div>
                <div>
                  <dt className="font-display text-[10px] font-bold uppercase tracking-[0.2em] text-ink/60">
                    Tiket
                  </dt>
                  <dd className="font-display text-base font-bold uppercase tabular-nums text-magenta sm:text-lg">
                    {event?.ticket_prefix ?? "GBR-2026"}
                  </dd>
                </div>
              </dl>
            </div>

            <div className="relative lg:col-span-5">
              <div className="relative grid h-full place-items-center">
                <HeroSlideshow images={event?.hero_images ?? []} />
                <div className="absolute -right-3 top-6 z-10 brutal-card-cobalt px-3 py-2 text-xs sm:text-sm">
                  Hanya satu kali scan.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="border-y-[3px] border-ink bg-ink py-2">
          <div className="overflow-hidden">
            <div className="flex animate-[rise_0.5s_ease] gap-8 whitespace-nowrap font-display text-sm font-bold uppercase tracking-widest text-cream">
              {Array.from({ length: 2 }).flatMap((_, i) => (
                <div key={i} className="flex gap-8 px-4">
                  <span>★ Registrasi Gratis</span>
                  <span className="text-magenta">— QR Anti Duplikat —</span>
                  <span>★ Check-in Real-Time</span>
                  <span className="text-lime">— Anti Calo —</span>
                  <span>★ Tiket Digital</span>
                  <span className="text-cobalt-200">— Festival 2026 —</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FORM / TIKET ===================== */}
      <section id="daftar" className="bg-cream py-12 lg:py-20">
        <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="grid gap-8 px-4 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <div className="brutal-card p-6 sm:p-8">
                <div className="flex items-center justify-between">
                  <span className="brutal-tag bg-magenta text-cream">
                    Step 01 / Daftar
                  </span>
                  <span className="font-mono text-xs text-ink/50">/01</span>
                </div>
                <h2 className="mt-4 font-display text-3xl font-extrabold uppercase leading-tight sm:text-4xl">
                  Isi formulir,
                  <br />
                  <span className="text-cobalt">terima tiket QR.</span>
                </h2>
                <p className="mt-3 max-w-md text-sm text-ink/70">
                  Cukup nama, email, dan nomor telepon. Data tersimpan di
                  database panitia.
                </p>

                <div className="mt-8">
                  {event ? (
                    <RegistrationForm eventId={event.id} onSuccess={setTicket} />
                  ) : (
                    <div className="rounded-md border-[3px] border-dashed border-ink/40 bg-cream2 p-6 text-sm text-ink/70">
                      Belum ada event yang dibuka. Panitia dapat membuat event
                      baru di dashboard.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              {ticket ? (
                <TicketCard registrant={ticket} />
              ) : (
                <div className="brutal-card relative p-6">
                  <div className="flex items-center justify-between">
                    <span className="brutal-tag bg-cream2">Tiketmu</span>
                    <span className="font-mono text-xs text-ink/50">
                      GBR-2026-XXXX
                    </span>
                  </div>
                  <div className="mt-6 grid h-56 place-items-center border-[3px] border-dashed border-ink/40 bg-cream2">
                    <div className="text-center">
                      <div className="font-display text-3xl font-extrabold uppercase text-ink/40">
                        ?
                      </div>
                      <p className="mt-2 max-w-[14rem] text-xs uppercase tracking-widest text-ink/50">
                        Tiketmu akan muncul di sini
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-3 gap-2 text-center">
                    <div className="border-[3px] border-ink bg-cream2 p-2">
                      <div className="font-display text-[10px] uppercase text-ink/60">Nama</div>
                      <div className="font-display text-sm font-bold">— — —</div>
                    </div>
                    <div className="border-[3px] border-ink bg-cream2 p-2">
                      <div className="font-display text-[10px] uppercase text-ink/60">Serial</div>
                      <div className="font-display text-sm font-bold">GBR-2026-?</div>
                    </div>
                    <div className="border-[3px] border-ink bg-cream2 p-2">
                      <div className="font-display text-[10px] uppercase text-ink/60">Status</div>
                      <div className="font-display text-sm font-bold">REGISTERED</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}