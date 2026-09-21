import type { Trip } from "./types";

type Slot = Pick<Trip, "id" | "scheduled_date" | "start_time" | "duration_hours">;
type TimeOnly = Pick<Trip, "start_time" | "duration_hours">;

/** Minutes since midnight for "HH:MM" or "HH:MM:SS". */
function minutes(time: string) {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function slotRange(trip: TimeOnly) {
  const start = minutes(trip.start_time);
  return { start, end: start + Math.round(Number(trip.duration_hours) * 60) };
}

export function formatRange(trip: TimeOnly) {
  const { start, end } = slotRange(trip);
  const hhmm = (value: number) =>
    `${String(Math.floor(value / 60) % 24).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
  return `${hhmm(start)}–${hhmm(end)}`;
}

/** Same day and the time ranges overlap (touching end-to-start does not count). */
export function overlaps(a: Slot, b: Slot) {
  if (a.id === b.id || a.scheduled_date !== b.scheduled_date) return false;
  const ra = slotRange(a);
  const rb = slotRange(b);
  return ra.start < rb.end && rb.start < ra.end;
}

/** Jobs the companion has already committed to that clash with a candidate trip. */
export function findConflicts(candidate: Slot, committed: (Slot & Pick<Trip, "status" | "title">)[]) {
  return committed.filter(
    (trip) => (trip.status === "matched" || trip.status === "in_progress") && overlaps(candidate, trip),
  );
}

/** Monday-based week containing today (in Bangkok), shifted by `offset` weeks. */
export function weekDays(offset: number) {
  const today = new Date(`${new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date())}T00:00:00Z`);
  const monday = new Date(today);
  monday.setUTCDate(today.getUTCDate() - ((today.getUTCDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(monday);
    day.setUTCDate(monday.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

export function todayInBangkok() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Bangkok" }).format(new Date());
}
