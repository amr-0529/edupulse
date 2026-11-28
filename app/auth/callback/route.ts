import { authCallbackPath } from "@/lib/auth-routing";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Email verification and password recovery callback.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const next = searchParams.get("next");
  const code = searchParams.get("code");

  let success = false;

  if (code) {
    const supabase = await createClient();
    const { error } =
      await supabase.auth.exchangeCodeForSession(code);

    success = !error;
  }

  return new NextResponse(null, {
    status: 307,
    headers: {
      Location: authCallbackPath(next, success),
      "Cache-Control": "no-store",
    },
  });
}