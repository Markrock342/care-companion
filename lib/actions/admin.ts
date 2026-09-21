"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types";

/** Every call goes through a security definer RPC that re-checks admin rights and writes an audit row. */
async function callAdminRpc(fn: string, args: Record<string, unknown>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc(fn, args);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setVerification(userId: string, status: "approved" | "rejected", note?: string) {
  return callAdminRpc("admin_set_verification", { p_user: userId, p_status: status, p_note: note ?? "" });
}

export async function setAccountStatus(userId: string, status: "active" | "suspended", note?: string) {
  return callAdminRpc("admin_set_account_status", { p_user: userId, p_status: status, p_note: note ?? "" });
}

export async function setUserRole(userId: string, role: UserRole) {
  return callAdminRpc("admin_set_role", { p_user: userId, p_role: role });
}

export async function adminCancelTrip(tripId: string, note?: string) {
  return callAdminRpc("admin_cancel_trip", { p_trip: tripId, p_note: note ?? "" });
}
