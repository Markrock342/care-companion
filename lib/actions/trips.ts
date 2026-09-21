"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TripCategory } from "@/lib/types";

export async function createTrip(input: {
  category: TripCategory;
  title: string;
  details: string;
  origin_label: string;
  origin_lat: number | null;
  origin_lng: number | null;
  origin_province: string;
  destination_label: string;
  destination_lat: number | null;
  destination_lng: number | null;
  destination_province: string;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  offered_compensation: number;
  inviteCompanionId?: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data, error } = await supabase
    .from("trips")
    .insert({
      customer_id: user.id,
      category: input.category,
      title: input.title.trim(),
      details: input.details.trim(),
      origin_label: input.origin_label.trim(),
      origin_lat: input.origin_lat,
      origin_lng: input.origin_lng,
      origin_province: input.origin_province,
      destination_label: input.destination_label.trim(),
      destination_lat: input.destination_lat,
      destination_lng: input.destination_lng,
      destination_province: input.destination_province,
      scheduled_date: input.scheduled_date,
      start_time: input.start_time,
      duration_hours: input.duration_hours,
      offered_compensation: input.offered_compensation,
    })
    .select("id")
    .single();

  if (error || !data) return { error: error?.message ?? "create_failed" };

  if (input.inviteCompanionId) {
    await supabase.from("offers").insert({
      trip_id: data.id,
      companion_id: input.inviteCompanionId,
      initiated_by: "customer",
      message: "",
    });
  }

  revalidatePath("/", "layout");
  return { id: data.id as string };
}

export async function applyToTrip(tripId: string, message: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, verification_status")
    .eq("id", user.id)
    .single();

  if (
    profile?.role !== "companion" ||
    profile.verification_status !== "approved"
  ) {
    return { error: "not_approved" };
  }

  const { error } = await supabase.from("offers").insert({
    trip_id: tripId,
    companion_id: user.id,
    initiated_by: "companion",
    message: message.trim(),
  });

  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true as const };
}

export async function inviteCompanion(tripId: string, companionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { error } = await supabase.from("offers").insert({
    trip_id: tripId,
    companion_id: companionId,
    initiated_by: "customer",
    message: "",
  });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true as const };
}

export async function acceptOffer(offerId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("accept_offer", { p_offer_id: offerId });
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function declineOffer(offerId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("offers")
    .update({ status: "declined" })
    .eq("id", offerId);
  if (error) return { error: error.message };
  revalidatePath("/", "layout");
  return { ok: true as const };
}

export async function startTrip(tripId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("start_trip", { p_trip_id: tripId });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true as const };
}

export async function completeTrip(tripId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("complete_trip", { p_trip_id: tripId });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true as const };
}

export async function cancelTrip(tripId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_trip", { p_trip_id: tripId });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}`);
  return { ok: true as const };
}

export async function sendMessage(tripId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };
  const text = body.trim();
  if (!text) return { error: "empty" };

  const { error } = await supabase.from("messages").insert({
    trip_id: tripId,
    sender_id: user.id,
    body: text,
  });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${tripId}/chat`);
  return { ok: true as const };
}

export async function submitReview(input: {
  tripId: string;
  revieweeId: string;
  rating: number;
  comment: string;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "unauthorized" };

  const { error } = await supabase.from("reviews").insert({
    trip_id: input.tripId,
    reviewer_id: user.id,
    reviewee_id: input.revieweeId,
    rating: input.rating,
    comment: input.comment.trim(),
  });
  if (error) return { error: error.message };
  revalidatePath(`/trips/${input.tripId}`);
  return { ok: true as const };
}
