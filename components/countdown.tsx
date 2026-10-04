"use client";

import { useEffect, useState } from "react";

export function Countdown({ targetDate }: { targetDate: string | null }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    if (!targetDate) return;

    // Hitung sisa waktu dengan paksaan zona waktu WITA / GMT+8
    function calculate() {
      const now = new Date().getTime();
      
      // Jika string waktu sudah dalam format standar dengan timezone (mengandung "Z" atau "+"),
      // maka Date.parse bisa membacanya langsung.
      // Jika tidak, baru kita paksakan +08:00
      let targetString = targetDate!;
      if (!targetString.includes("+") && !targetString.endsWith("Z")) {
        targetString = `${targetString}+08:00`;
      }
        
      const target = new Date(targetString).getTime();
      const diff = target - now;

      // Debugging: uncomment jika butuh mengecek waktu 
      // console.log("Target Date String:", targetString, "Target:", target, "Now:", now, "Diff:", diff);

      if (diff <= 0) {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      });
    }

    calculate();
    const timer = setInterval(calculate, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  // Render dummy UI atau kosong jika tidak ada waktu target atau belum di-mount (mencegah SSR mismatch)
  if (!targetDate || !timeLeft) {
    return (
      <div className="flex gap-2">
        <TimeUnit value="--" label="Hari" />
        <TimeUnit value="--" label="Jam" />
        <TimeUnit value="--" label="Menit" />
        <TimeUnit value="--" label="Detik" />
      </div>
    );
  }

  // Jika waktu acara sudah lewat/saat acara dimulai
  if (
    timeLeft.days === 0 &&
    timeLeft.hours === 0 &&
    timeLeft.minutes === 0 &&
    timeLeft.seconds === 0
  ) {
    return (
      <div className="brutal-card-magenta px-4 py-2 font-display text-lg font-bold uppercase tracking-wider text-center">
        ACARA SEDANG BERLANGSUNG
        <div className="text-xs mt-1 font-mono opacity-80 normal-case tracking-normal">
          Waktu Target Server: {targetDate}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2 sm:gap-3">
      <TimeUnit value={timeLeft.days.toString().padStart(2, "0")} label="Hari" />
      <div className="flex flex-col justify-center font-display text-2xl font-black text-ink">:</div>
      <TimeUnit value={timeLeft.hours.toString().padStart(2, "0")} label="Jam" />
      <div className="flex flex-col justify-center font-display text-2xl font-black text-ink">:</div>
      <TimeUnit value={timeLeft.minutes.toString().padStart(2, "0")} label="Menit" />
      <div className="flex flex-col justify-center font-display text-2xl font-black text-ink">:</div>
      <TimeUnit value={timeLeft.seconds.toString().padStart(2, "0")} label="Detik" />
    </div>
  );
}

function TimeUnit({ value, label }: { value: string; label: string }) {
  return (
    <div className="brutal-card bg-cream px-2 py-1 text-center sm:px-3 sm:py-2">
      <div className="font-display text-xl font-extrabold tabular-nums sm:text-3xl text-ink">
        {value}
      </div>
      <div className="font-display text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-ink/70">
        {label}
      </div>
    </div>
  );
}
