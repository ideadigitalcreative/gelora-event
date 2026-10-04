import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  id: z.string().trim().min(1, "ID peserta wajib diisi"),
});

export async function DELETE(request: NextRequest) {
  const supabase = createSupabaseServerClient();

  // Pastikan hanya admin yang sudah login bisa hapus.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "ID tidak valid" },
      { status: 400 }
    );
  }

  // Hapus record check-in terkait dulu (jika ada), lalu peserta.
  await supabase.from("checkins").delete().eq("participant_id", parsed.data.id);

  const { error } = await supabase
    .from("participants")
    .delete()
    .eq("id", parsed.data.id);

  if (error) {
    return NextResponse.json(
      { error: "Gagal menghapus peserta" },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
