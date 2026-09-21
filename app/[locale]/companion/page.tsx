import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TripCard } from "@/components/trips/trip-card";
import { StatusPill } from "@/components/ui/status-pill";
import { OfferButtons } from "@/components/trips/trip-actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Offer, Trip } from "@/lib/types";
import { WeekCalendar } from "@/components/trips/week-calendar";
import { findConflicts, formatRange } from "@/lib/schedule";
import { formatDate } from "@/lib/format";

export default async function CompanionHome({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ week?: string }>;
}) {
  const { locale } = await params;
  const weekParam = Number((await searchParams).week ?? 0);
  const weekOffset = Number.isInteger(weekParam) ? Math.max(-52, Math.min(52, weekParam)) : 0;
  setRequestLocale(locale);
  const t = await getTranslations("companionDash");
  const tc = await getTranslations("calendar");
  const { user, profile } = await requireProfile();
  if (profile.role === "admin") redirect({ href: "/admin", locale });
  if (profile.role === "customer") redirect({ href: "/customer", locale });

  const supabase = await createClient();
  const { data: myTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("companion_id", user.id)
    .order("scheduled_date", { ascending: false });

  const { data: openTrips } = await supabase
    .from("trips")
    .select("*")
    .eq("status", "open")
    .order("scheduled_date", { ascending: true })
    .limit(20);

  const { data: incoming } = await supabase
    .from("offers")
    .select("*")
    .eq("companion_id", user.id)
    .eq("status", "pending")
    .eq("initiated_by", "customer");

  const offers = (incoming ?? []) as Offer[];
  const tripIds = offers.map((o) => o.trip_id);
  const { data: offerTrips } = tripIds.length
    ? await supabase.from("trips").select("*").in("id", tripIds)
    : { data: [] };
  const tripMap = new Map(((offerTrips ?? []) as Trip[]).map((trip) => [trip.id, trip]));

  const approved = profile.verification_status === "approved";
  const area = new Set(profile.service_provinces);
  const open = ((openTrips ?? []) as Trip[]).filter(
    (trip) =>
      area.size === 0 ||
      area.has(trip.origin_province) ||
      area.has(trip.destination_province),
  );

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl">{t("title")}</h1>
            <div className="mt-2">
              <StatusPill value={profile.verification_status} />
            </div>
          </div>
          <ButtonLink href="/companion/profile" variant="secondary">
            {t("editProfile")}
          </ButtonLink>
        </div>

        {!approved ? (
          <p className="mt-6 rounded-[24px] bg-gold px-5 py-4 font-semibold text-ink">
            {t("pendingVerify")}
          </p>
        ) : null}

        <WeekCalendar trips={(myTrips ?? []) as Trip[]} offset={weekOffset} />

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("incoming")}</h2>
          <ul className="mt-4 grid gap-3">
            {offers.length === 0 ? (
              <li className="text-ink-soft">—</li>
            ) : (
              offers.map((offer) => {
                const trip = tripMap.get(offer.trip_id);
                const clashes = trip ? findConflicts(trip, (myTrips ?? []) as Trip[]) : [];
                const warning = clashes.length
                  ? tc("conflictWith", { title: clashes[0].title, time: formatRange(clashes[0]) })
                  : undefined;
                return (
                  <li key={offer.id} className="rounded-[24px] bg-paper p-4 shadow-[var(--shadow-raise)]">
                    <p className="font-display text-xl">{trip?.title}</p>
                    {trip ? (
                      <p className="mt-1 text-sm text-ink-soft">
                        {formatDate(trip.scheduled_date, locale)} · {formatRange(trip)}
                      </p>
                    ) : null}
                    {warning ? (
                      <p role="alert" className="mt-2 rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
                        ⚠ {warning}
                      </p>
                    ) : null}
                    <div className="mt-3">
                      <OfferButtons offerId={offer.id} canAccept={approved} conflictWarning={warning} />
                    </div>
                  </li>
                );
              })
            )}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("myJobs")}</h2>
          <div className="mt-4 grid gap-4">
            {((myTrips ?? []) as Trip[]).length === 0 ? (
              <EmptyState title="—" />
            ) : (
              ((myTrips ?? []) as Trip[]).map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))
            )}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("open")}</h2>
          <div className="mt-4 grid gap-4">
            {open.length === 0 ? (
              <EmptyState title={t("emptyOpen")} />
            ) : (
              open.map((trip) => <TripCard key={trip.id} trip={trip} />)
            )}
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
