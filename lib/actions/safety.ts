"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const PHONE = /^\+?[0-9]{9,12}$/;

export async function saveEmergencyContact(input: { name: string; relation: string; phone: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" as const };

  const phone = input.phone.replace(/[\s-]/g, "");
  if (!PHONE.test(phone)) return { error: "invalid_phone" as const };

  const { error } = await supabase.from("emergency_contacts").upsert({
    user_id: user.id,
    name: input.name.trim().slice(0, 80),
    relation: input.relation.trim().slice(0, 40),
    phone,
    updated_at: new Date().toISOString(),
  });
  if (error) return { error: "save_failed" as const };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function setTripShare(tripId: string, enabled: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("set_trip_share", { p_trip_id: tripId, p_enabled: enabled });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { token: (data as string | null) ?? null };
}

export async function updateTripLocation(tripId: string, lat: number, lng: number) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("update_trip_location", {
    p_trip_id: tripId,
    p_lat: lat,
    p_lng: lng,
  });
  if (error) return { error: error.message };
  return { at: data as string };
}
