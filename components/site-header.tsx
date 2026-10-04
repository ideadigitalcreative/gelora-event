import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { SiteHeaderNav } from "./site-header-nav";

const NAV = [
  { href: "/", label: "Beranda" },
  { href: "/scanner", label: "Scanner" },
  { href: "/dashboard", label: "Dashboard" },
];

export async function SiteHeader() {
  let userEmail: string | null = null;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.auth.getUser();
    userEmail = data.user?.email ?? null;
  } catch {
    // Biarkan null kalau gagal membaca cookie di server (misal saat build).
    userEmail = null;
  }

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
          {userEmail ? (
            <div className="flex items-center gap-2">
              <span
                className="brutal-tag border-ink bg-cream hidden font-mono sm:inline-flex"
                title={userEmail}
              >
                {userEmail.length > 22
                  ? `${userEmail.slice(0, 20)}…`
                  : userEmail}
              </span>
              <form action="/api/logout" method="POST">
                <button type="submit" className="brutal-btn-ghost text-xs">
                  Logout
                </button>
              </form>
            </div>
          ) : (
            <Link href="/login" className="brutal-btn-magenta text-xs">
              Login
              <span aria-hidden>→</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}