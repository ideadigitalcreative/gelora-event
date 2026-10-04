import Link from "next/link";
import { SiteHeaderNav } from "./site-header-nav";
import { HeaderAuth } from "./header-auth";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/scanner", label: "Scanner" },
  { href: "/dashboard", label: "Dashboard" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b-[3px] border-ink bg-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="group flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-sm border-[3px] border-ink bg-magenta text-cream shadow-brutal">
            <span className="font-display text-lg font-extrabold leading-none">G</span>
          </span>
          <span className="font-display text-lg font-extrabold uppercase tracking-tight">
            Event<span className="text-magenta">/</span>Gelora
          </span>
        </Link>

        <div className="flex items-center gap-2">
          <SiteHeaderNav items={NAV} />
          <HeaderAuth />
        </div>
      </div>
    </header>
  );
}