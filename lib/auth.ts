import { cache } from "react";
import type { User } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { createClient } from "./supabase/server";
import { getSupabaseEnv } from "./supabase/config";
import type { Profile } from "./types";
import { dashboardPath } from "./paths";

export { dashboardPath };

export const getAuthState = cache(async () => {
  // Always read cookies so these pages stay dynamic after env is added.
  await cookies();
  if (!getSupabaseEnv().configured) {
    return { user: null, profile: null as Profile | null };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { user: null, profile: null as Profile | null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return { user, profile: (profile as Profile | null) ?? null };
});

export async function requireUser() {
  const locale = await getLocale();
  const state = await getAuthState();
  if (!state.user) {
    redirect({ href: "/login", locale });
  }
  return state as { user: User; profile: Profile | null };
}

export async function requireProfile() {
  const locale = await getLocale();
  const { user, profile } = await requireUser();
  if (!profile) {
    redirect({ href: "/onboarding", locale });
  }
  return { user, profile: profile as Profile, locale };
}
