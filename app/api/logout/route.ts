import { NextResponse, type NextRequest } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  const supabase = createSupabaseServerClient();
  await supabase.auth.signOut();
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.searchParams.delete("next");
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(request: NextRequest) {
  return POST(request);
}