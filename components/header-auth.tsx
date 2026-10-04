"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function HeaderAuth() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null);
    });
  }, []);

  // Render placeholder saat belum mount untuk hindari hydration mismatch.
  if (!mounted) {
    return <span className="invisible text-xs">Login</span>;
  }

  return userEmail ? (
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
  );
}
