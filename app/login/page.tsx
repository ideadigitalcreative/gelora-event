import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { LoginClient } from "./login-client";

export const metadata: Metadata = {
  title: "Login Admin — GELORA EVENT",
  description: "Masuk untuk mengakses dashboard dan scanner check-in.",
};

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let adminCount = 0;
  try {
    const supabase = createSupabaseServerClient();
    const { data } = await supabase.rpc("admin_count");
    adminCount = Number(data ?? 0);
  } catch {
    adminCount = 0;
  }

  return <LoginClient needsSetup={adminCount === 0} />;
}