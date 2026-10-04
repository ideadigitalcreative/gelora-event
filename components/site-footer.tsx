export function SiteFooter() {
  return (
    <footer className="border-t-[3px] border-ink bg-ink text-cream">
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 sm:px-6 sm:grid-cols-2 lg:grid-cols-3 lg:px-8">
        <div>
          <div className="font-display text-xl font-extrabold uppercase tracking-tight">
            GELORA<span className="text-magenta">/</span>2026
          </div>
          <p className="mt-2 max-w-xs text-sm text-cream/70">
            Tiket festival digital dengan QR check-in. Setiap tiket hanya
            berlaku satu kali.
          </p>
        </div>
        <div className="text-sm text-cream/70">
          <div className="font-display text-xs font-bold uppercase tracking-widest text-magenta">
            Hari & Tempat
          </div>
          <div className="mt-2 font-display text-base font-bold uppercase">
            12 Oktober 2026
          </div>
          <div className="text-cream">Ball Room Hotel Harper, Makassar</div>
        </div>
        <div className="text-sm text-cream/70">
          <div className="font-display text-xs font-bold uppercase tracking-widest text-lime">
            Penyelenggara
          </div>
          <div className="mt-2 font-display text-base font-bold uppercase">
            Gelora Event
          </div>
          <div>Powered by DPD Gelora Makassar.</div>
        </div>
      </div>
      <div className="border-t border-cream/10">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 text-xs text-cream/50 sm:px-6 lg:px-8">
          <span>© 2026 Event × Gelora.</span>
          <span className="font-mono">v.1 — all caps mode on</span>
        </div>
      </div>
    </footer>
  );
}