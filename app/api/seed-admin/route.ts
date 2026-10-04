import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase-server";

const bodySchema = z.object({
  email: z.string().trim().email("Format email tidak valid").max(160),
  password: z
    .string()
    .min(8, "Password minimal 8 karakter")
    .max(72, "Password terlalu panjang"),
  full_name: z.string().trim().min(2).max(80).optional(),
});

export async function POST(request: NextRequest) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Body tidak valid" }, { status: 400 });
  }
  const parsed = bodySchema.safeParse(payload);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Data tidak valid" },
      { status: 400 }
    );
  }

  const supabase = createSupabaseServerClient();

  // Tolak kalau sudah ada admin (UI harusnya ngegate juga, ini cuma safety net).
  const { data: countData, error: countError } = await supabase.rpc(
    "admin_count"
  );
  if (countError) {
    return NextResponse.json(
      { error: "Tidak bisa mengecek akun admin." },
      { status: 500 }
    );
  }
  const total = Number(countData ?? 0);
  if (total > 0) {
    return NextResponse.json(
      {
        error:
          "Admin sudah ada. Halaman ini hanya untuk setup awal. Silakan login di /login.",
      },
      { status: 409 }
    );
  }

  const { data, error } = await supabase.rpc("create_admin_user", {
    p_email: parsed.data.email,
    p_password: parsed.data.password,
    p_full_name: parsed.data.full_name ?? "Admin Panitia",
  });

  if (error) {
    return NextResponse.json(
      { error: error.message || "Gagal membuat akun admin." },
      { status: 500 }
    );
  }

  return NextResponse.json({ admin: data });
}

export async function GET() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.rpc("admin_count");
  if (error) {
    return NextResponse.json(
      { error: "Tidak bisa mengecek akun admin." },
      { status: 500 }
    );
  }
  return NextResponse.json({ admin_count: Number(data ?? 0) });
}