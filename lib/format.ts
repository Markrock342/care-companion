import type { TripStatus } from "./types";

export function formatBaht(value: number, locale: string) {
  return new Intl.NumberFormat(locale === "th" ? "th-TH" : "en-US", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(isoDate: string, locale: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function formatTime(time: string, locale: string) {
  const [h, m] = time.split(":");
  const date = new Date();
  date.setHours(Number(h), Number(m), 0, 0);
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDateTime(iso: string, locale: string) {
  return new Intl.DateTimeFormat(locale === "th" ? "th-TH" : "en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export function weekdayFromDate(isoDate: string) {
  const day = new Date(`${isoDate}T00:00:00`).getDay();
  return ["sun", "mon", "tue", "wed", "thu", "fri", "sat"][day];
}

export function initials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "CC";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

export function canChat(status: TripStatus) {
  return status === "matched" || status === "in_progress" || status === "completed";
}
