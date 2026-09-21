import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import type { Trip } from "@/lib/types";
import { formatBaht, formatDate, formatTime } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import { StatusPill } from "@/components/ui/status-pill";

export async function TripCard({ trip }: { trip: Trip }) {
  const t = await getTranslations();
  const locale = await getLocale();
  const when = `${trip.scheduled_date}T${trip.start_time}`;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="block rounded-[28px] bg-paper p-5 shadow-[var(--shadowRaise)] transition-transform duration-[var(--durationFast)] hover:-translate-y-0.5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-flame">
            {t(`category.${trip.category}`)}
          </p>
          <h3 className="mt-1 font-display text-xl">{trip.title}</h3>
        </div>
        <StatusPill value={trip.status} />
      </div>
      <p className="mt-3 flex items-center gap-2 text-sm text-ink-soft">
        <span className="grid size-6 place-items-center rounded-full bg-ink text-[11px] font-bold text-paper">
          A
        </span>
        {trip.origin_label}
        <span aria-hidden className="h-px w-6 bg-[repeating-linear-gradient(90deg,currentColor_0_4px,transparent_4px_7px)]" />
        <span className="grid size-6 place-items-center rounded-full bg-flame text-[11px] font-bold text-paper">
          B
        </span>
        {trip.destination_label}
      </p>
      <p className="mt-2 text-sm text-ink-soft">
        {provinceName(trip.origin_province, locale)} ·{" "}
        <time dateTime={when}>
          {formatDate(trip.scheduled_date, locale)} {formatTime(trip.start_time, locale)}
        </time>
      </p>
      <p className="mt-3 font-display text-lg">
        {formatBaht(Number(trip.offered_compensation), locale)}
      </p>
    </Link>
  );
}
