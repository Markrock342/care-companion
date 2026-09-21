"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole, Weekday } from "@/lib/types";

export async function createProfile(input: {
  role: UserRole;
  full_name: string;
  phone: string;
  bio: string;
  locale: "th" | "en";
  skills?: string[];
  service_provinces?: string[];
  available_days?: Weekday[];
  available_from?: string;
  available_to?: string;
  experience_years?: number | null;
  min_compensation?: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const role = input.role === "companion" ? "companion" : "customer";
  const { error } = await supabase.from("profiles").insert({
    id: user.id,
    role,
    full_name: input.full_name.trim(),
    phone: input.phone.trim() || null,
    bio: input.bio.trim() || null,
    locale: input.locale,
    avatar_url: user.user_metadata?.avatar_url ?? user.user_metadata?.picture ?? null,
    skills: input.skills ?? [],
    service_provinces: input.service_provinces ?? [],
    available_days: input.available_days ?? [],
    available_from: input.available_from || null,
    available_to: input.available_to || null,
    experience_years: input.experience_years ?? null,
    min_compensation: input.min_compensation ?? null,
  });

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const, role };
}

export async function updateCompanionProfile(input: {
  full_name: string;
  phone: string;
  bio: string;
  skills: string[];
  service_provinces: string[];
  available_days: Weekday[];
  available_from: string;
  available_to: string;
  experience_years: number | null;
  min_compensation: number | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: input.full_name.trim(),
      phone: input.phone.trim() || null,
      bio: input.bio.trim() || null,
      skills: input.skills,
      service_provinces: input.service_provinces,
      available_days: input.available_days,
      available_from: input.available_from || null,
      available_to: input.available_to || null,
      experience_years: input.experience_years,
      min_compensation: input.min_compensation,
    })
    .eq("id", user.id);

  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function updateAvatar(path: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };
  if (!path.startsWith(`${user.id}/`) || path.includes("..")) return { error: "invalid_path" as const };

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  const { data: previous } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();

  const { error } = await supabase.from("profiles").update({ avatar_url: publicUrl }).eq("id", user.id);
  if (error) return { error: "update_failed" as const };

  // Remove the old upload so each user keeps one file; Google photo URLs are left alone.
  const marker = "/storage/v1/object/public/avatars/";
  const oldUrl = previous?.avatar_url as string | null | undefined;
  if (oldUrl?.includes(marker)) {
    const oldPath = oldUrl.split(marker)[1];
    if (oldPath && oldPath !== path && oldPath.startsWith(`${user.id}/`)) {
      await supabase.storage.from("avatars").remove([oldPath]);
    }
  }

  revalidatePath("/", "layout");
  return { url: publicUrl };
}
