import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { dashboardPath } from "@/lib/auth";
import type { Profile } from "@/lib/types";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ locale: string }> },
) {
  const { locale } = await params;
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const origin = url.origin;

  if (code) {
    const supabase = await createClient();
    await supabase.auth.exchangeCodeForSession(code);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      if (profile) {
        return NextResponse.redirect(
          `${origin}/${locale}${dashboardPath((profile as Profile).role)}`,
        );
      }
      return NextResponse.redirect(`${origin}/${locale}/onboarding`);
    }
  }

  return NextResponse.redirect(`${origin}/${locale}/login`);
}
