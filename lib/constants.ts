import type { TripCategory, Weekday } from "./types";

export const CATEGORIES: TripCategory[] = [
  "hospital",
  "doctor",
  "bank",
  "government",
  "shopping",
  "other",
];

export const WEEKDAYS: Weekday[] = [
  "sun",
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
];

export const SKILL_OPTIONS = [
  "walking",
  "wheelchair",
  "documents",
  "shopping",
  "queue",
  "language",
] as const;

export const TRIP_STATUS_ORDER = [
  "open",
  "matched",
  "in_progress",
  "completed",
  "cancelled",
] as const;
