import type { CompanionCardData, Profile, Review } from "./types";
import type { SupabaseClient } from "@supabase/supabase-js";

export async function fetchCompanionCards(
  supabase: SupabaseClient,
  opts?: { approvedOnly?: boolean },
): Promise<CompanionCardData[]> {
  let query = supabase
    .from("profiles")
    .select("*")
    .eq("role", "companion")
    .eq("account_status", "active");

  if (opts?.approvedOnly !== false) {
    query = query.eq("verification_status", "approved");
  }

  const { data: profiles, error } = await query;
  if (error) throw error;

  const ids = (profiles ?? []).map((p) => p.id);
  const ratings = new Map<string, { sum: number; count: number }>();

  if (ids.length > 0) {
    const { data: reviews } = await supabase
      .from("reviews")
      .select("reviewee_id, rating")
      .in("reviewee_id", ids);

    for (const review of (reviews ?? []) as Pick<Review, "reviewee_id" | "rating">[]) {
      const current = ratings.get(review.reviewee_id) ?? { sum: 0, count: 0 };
      current.sum += review.rating;
      current.count += 1;
      ratings.set(review.reviewee_id, current);
    }
  }

  return ((profiles ?? []) as Profile[]).map((profile) => {
    const stats = ratings.get(profile.id);
    return {
      ...profile,
      avg_rating: stats ? stats.sum / stats.count : 0,
      review_count: stats?.count ?? 0,
    };
  });
}

export async function fetchReviewsFor(
  supabase: SupabaseClient,
  userId: string,
): Promise<(Review & { reviewer?: Pick<Profile, "full_name" | "avatar_url"> })[]> {
  const { data } = await supabase
    .from("reviews")
    .select("*")
    .eq("reviewee_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  const reviews = (data ?? []) as Review[];
  const reviewerIds = [...new Set(reviews.map((r) => r.reviewer_id))];
  if (reviewerIds.length === 0) return reviews;

  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url")
    .in("id", reviewerIds);

  const map = new Map((people ?? []).map((p) => [p.id, p]));
  return reviews.map((review) => ({
    ...review,
    reviewer: map.get(review.reviewer_id),
  }));
}
