import createIntlMiddleware from "next-intl/middleware";
import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { routing } from "./i18n/routing";
import { getSupabaseEnv } from "./lib/supabase/config";

const intlMiddleware = createIntlMiddleware(routing);

export async function proxy(request: NextRequest) {
  const response = intlMiddleware(request);
  const { url, anonKey, configured } = getSupabaseEnv();
  if (!configured) return response;

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
        if (headers) {
          Object.entries(headers).forEach(([key, value]) => {
            response.headers.set(key, value);
          });
        } else {
          response.headers.set("Cache-Control", "private, no-store");
        }
      },
    },
  });

  await supabase.auth.getUser();
  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
