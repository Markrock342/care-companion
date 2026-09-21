"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "unauthorized" as const };
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profile?.role !== "admin") return { supabase, error: "forbidden" as const };
  return { supabase, error: null };
}

export async function setVerification(
  userId: string,
  status: "approved" | "rejected",
  note?: string,
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      verification_status: status,
      verification_note: note ?? null,
    })
    .eq("id", userId);
  if (updateError) return { error: updateError.message };
  revalidatePath("/admin");
  return { ok: true as const };
}

export async function setAccountStatus(
  userId: string,
  status: "active" | "suspended",
) {
  const { supabase, error } = await requireAdmin();
  if (error) return { error };
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ account_status: status })
    .eq("id", userId);
  if (updateError) return { error: updateError.message };
  revalidatePath("/admin");
  return { ok: true as const };
}
