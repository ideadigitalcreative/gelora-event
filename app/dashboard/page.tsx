import { listEvents } from "@/lib/events";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { redirect } from "next/navigation";
import type { Registrant } from "@/lib/registrants";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    // Middleware sudah handle, tapi sebagai safety fallback.
    redirect("/login?next=/dashboard");
  }

  const events = await listEvents();

  const participants: Record<string, Registrant[]> = {};
  await Promise.all(
    events.map(async (ev) => {
      const { data } = await supabase
        .from("participants")
        .select(
          "id, event_id, name, email, phone, institution, registration_number, qr_token, status, registered_at, checked_in_at"
        )
        .eq("event_id", ev.id)
        .order("registered_at", { ascending: true });
      participants[ev.slug] = (data ?? []) as Registrant[];
    })
  );

  return (
    <DashboardClient
      initialEvents={events}
      initialParticipants={participants}
      userEmail={user.email ?? null}
    />
  );
}