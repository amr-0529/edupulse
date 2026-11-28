import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),

        setAll(list) {
          list.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );

          response = NextResponse.next({ request });

          list.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const prefix = request.nextUrl.pathname.split("/")[1];

  if (["student", "mentor", "admin"].includes(prefix)) {
    let destination: NextResponse | undefined;

    if (!user) {
      destination = NextResponse.redirect(
        new URL("/login", request.url)
      );
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role,is_active")
        .eq("id", user.id)
        .maybeSingle();

      if (!profile) {
        destination = NextResponse.redirect(
          new URL("/login?error=noprofile", request.url)
        );
      } else if (!profile.is_active) {
        destination = NextResponse.redirect(
          new URL("/auth/deactivated", request.url)
        );
      } else if (profile.role !== prefix) {
        destination = NextResponse.rewrite(
          new URL("/403", request.url),
          { status: 403 }
        );
      }
    }

    if (destination) {
      for (const cookie of response.cookies.getAll()) {
        destination.cookies.set(cookie);
      }

      return destination;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};