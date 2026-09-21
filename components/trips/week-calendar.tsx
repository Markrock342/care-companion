import { getLocale, getTranslations } from "next-intl/server";
import { CaretLeft, CaretRight, Warning } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import { findConflicts, formatRange, slotRange, todayInBangkok, weekDays } from "@/lib/schedule";
import type { Trip } from "@/lib/types";

const TONE: Record<string, string> = {
  matched: "border-ink bg-paper",
  in_progress: "border-flame bg-flame/10",
  completed: "border-ok/60 bg-ok/10 text-ink-soft",
};

export async function WeekCalendar({ trips, offset }: { trips: Trip[]; offset: number }) {
  const t = await getTranslations("calendar");
  const ts = await getTranslations("status");
  const locale = await getLocale();
  const days = weekDays(offset);
  const today = todayInBangkok();
  const intl = locale === "th" ? "th-TH" : "en-GB";
  const dayName = new Intl.DateTimeFormat(intl, { weekday: "short", timeZone: "UTC" });
  const dayNum = new Intl.DateTimeFormat(intl, { day: "numeric", month: "short", timeZone: "UTC" });
  const visible = trips.filter((trip) => trip.status !== "cancelled" && trip.status !== "open");
  const conflictCount = new Set(
    visible.filter((trip) => days.includes(trip.scheduled_date) && findConflicts(trip, visible).length > 0).map((trip) => trip.id),
  ).size;
  const range = `${dayNum.format(new Date(`${days[0]}T00:00:00Z`))} – ${dayNum.format(new Date(`${days[6]}T00:00:00Z`))}`;

  return (
    <section className="mt-10" aria-labelledby="week-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="week-title" className="font-display text-2xl">
            {t("title")}
          </h2>
          <p className="text-sm text-ink-soft">{range}</p>
        </div>
        <nav className="flex items-center gap-2" aria-label={t("title")}>
          <Link href={`/companion?week=${offset - 1}`} scroll={false} aria-label={t("prev")} className="grid size-10 place-items-center rounded-full ring-1 ring-line hover:ring-flame">
            <CaretLeft className="size-4" />
          </Link>
          <Link href="/companion" scroll={false} className="rounded-full px-4 py-2 text-sm font-semibold ring-1 ring-line hover:ring-flame">
            {t("thisWeek")}
          </Link>
          <Link href={`/companion?week=${offset + 1}`} scroll={false} aria-label={t("next")} className="grid size-10 place-items-center rounded-full ring-1 ring-line hover:ring-flame">
            <CaretRight className="size-4" />
          </Link>
        </nav>
      </div>

      {conflictCount > 0 ? (
        <p role="alert" className="mt-3 flex items-center gap-2 rounded-2xl bg-danger/10 px-4 py-3 text-sm font-semibold text-danger">
          <Warning weight="fill" className="size-5 shrink-0" />
          {t("conflictBanner", { n: conflictCount })}
        </p>
      ) : null}

      <ol className="mt-4 grid gap-2 md:grid-cols-7">
        {days.map((day) => {
          const items = visible
            .filter((trip) => trip.scheduled_date === day)
            .sort((a, b) => slotRange(a).start - slotRange(b).start);
          const isToday = day === today;
          const date = new Date(`${day}T00:00:00Z`);
          return (
            <li
              key={day}
              className={`flex min-h-24 flex-col gap-2 rounded-2xl p-2 md:min-h-44 ${isToday ? "bg-flame/5 ring-2 ring-flame" : "bg-mist"} ${items.length === 0 ? "max-md:hidden" : ""}`}
            >
              <p className={`px-1 text-xs font-bold ${isToday ? "text-flame" : "text-ink-soft"}`}>
                {dayName.format(date)} · {dayNum.format(date)}
                {isToday ? ` · ${t("today")}` : ""}
              </p>
              {items.length === 0 ? (
                <p className="px-1 text-xs text-ink-soft/60">—</p>
              ) : (
                items.map((trip) => {
                  const clash = findConflicts(trip, visible).length > 0;
                  return (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className={`block rounded-xl border-l-4 p-2 text-xs shadow-sm hover:-translate-y-0.5 transition-transform ${clash ? "border-danger bg-danger/10" : TONE[trip.status] ?? "border-line bg-paper"}`}
                    >
                      <span className="font-bold">{formatRange(trip)}</span>
                      <span className="mt-0.5 line-clamp-2 block">{trip.title}</span>
                      <span className="mt-1 block text-[11px] text-ink-soft">
                        {clash ? (
                          <span className="font-bold text-danger">{t("conflict")}</span>
                        ) : (
                          ts(trip.status)
                        )}
                      </span>
                    </Link>
                  );
                })
              )}
            </li>
          );
        })}
      </ol>
      {visible.every((trip) => !days.includes(trip.scheduled_date)) ? (
        <p className="mt-3 text-sm text-ink-soft md:hidden">{t("empty")}</p>
      ) : null}
    </section>
  );
}
