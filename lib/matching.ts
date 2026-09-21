import type { CompanionCardData, Profile, Trip, Weekday } from "./types";
import { weekdayFromDate } from "./format";

function overlapsProvince(companion: Profile, trip: Pick<Trip, "origin_province" | "destination_province">) {
  const areas = companion.service_provinces ?? [];
  if (areas.length === 0) return true;
  return (
    areas.includes(trip.origin_province) ||
    areas.includes(trip.destination_province)
  );
}

function availableThatDay(companion: Profile, date: string) {
  const days = companion.available_days ?? [];
  if (days.length === 0) return true;
  return days.includes(weekdayFromDate(date) as Weekday);
}

export function scoreCompanion(
  companion: CompanionCardData,
  trip: Pick<Trip, "origin_province" | "destination_province" | "scheduled_date" | "offered_compensation">,
) {
  if (companion.verification_status !== "approved") return -1;
  if (companion.account_status !== "active") return -1;
  if (companion.role !== "companion") return -1;
  if (!overlapsProvince(companion, trip)) return -1;
  if (!availableThatDay(companion, trip.scheduled_date)) return -1;
  if (
    companion.min_compensation != null &&
    trip.offered_compensation < companion.min_compensation
  ) {
    return -1;
  }

  let score = 10;
  score += companion.avg_rating * 8;
  score += Math.min(companion.review_count, 20);
  score += Math.min(companion.experience_years ?? 0, 10);
  if (
    companion.service_provinces.includes(trip.origin_province) &&
    companion.service_provinces.includes(trip.destination_province)
  ) {
    score += 6;
  }
  return score;
}

export function rankCompanions(
  companions: CompanionCardData[],
  trip: Pick<Trip, "origin_province" | "destination_province" | "scheduled_date" | "offered_compensation">,
) {
  return companions
    .map((companion) => ({ companion, score: scoreCompanion(companion, trip) }))
    .filter((row) => row.score >= 0)
    .sort((a, b) => b.score - a.score)
    .map((row) => row.companion);
}
