import { Link } from "@/i18n/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { Star } from "@phosphor-icons/react/dist/ssr";
import type { CompanionCardData } from "@/lib/types";
import { provinceName } from "@/lib/provinces";
import { initials } from "@/lib/format";
import { StatusPill } from "@/components/ui/status-pill";

export async function CompanionPlate({
  companion,
  href,
}: {
  companion: CompanionCardData;
  href?: string;
}) {
  const t = await getTranslations("companions");
  const locale = await getLocale();
  const areas = companion.service_provinces.slice(0, 3).map((id) => provinceName(id, locale));

  const inner = (
    <article className="relative overflow-hidden rounded-[28px] bg-plate p-[var(--space-md)] text-on-accent shadow-[var(--shadow-plate)] transition-transform duration-[var(--durationMed)] [transition-timing-function:var(--easeOut)] hover:-translate-y-1">
      <div className="pointer-events-none absolute -right-6 -top-8 size-28 rounded-full bg-flame/40" />
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-gold font-display text-xl text-ink">
            {companion.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={companion.avatar_url}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              initials(companion.full_name)
            )}
          </div>
          <div>
            <p className="font-display text-xl leading-tight">{companion.full_name}</p>
            <p className="mt-1 flex items-center gap-1 text-sm text-gold">
              <Star weight="fill" className="size-4" />
              {companion.avg_rating ? companion.avg_rating.toFixed(1) : "—"}
              <span className="text-on-accent/70">
                · {t("reviews", { n: companion.review_count })}
              </span>
            </p>
          </div>
        </div>
        {companion.verification_status !== "approved" ? (
          <StatusPill value={companion.verification_status} />
        ) : null}
      </div>
      {companion.bio ? (
        <p className="mt-4 line-clamp-2 text-sm text-on-accent/80">{companion.bio}</p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        {areas.map((area) => (
          <span key={area} className="rounded-full bg-on-accent/10 px-3 py-1 text-xs font-semibold">
            {area}
          </span>
        ))}
        {companion.experience_years ? (
          <span className="rounded-full bg-flame px-3 py-1 text-xs font-bold">
            {t("years", { n: companion.experience_years })}
          </span>
        ) : null}
      </div>
    </article>
  );

  if (!href) return inner;
  return (
    <Link href={href} className="block">
      {inner}
    </Link>
  );
}
