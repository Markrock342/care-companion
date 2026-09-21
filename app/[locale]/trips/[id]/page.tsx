import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { StatusPill } from "@/components/ui/status-pill";
import { RouteRibbon } from "@/components/brand/logo";
import { TripMap } from "@/components/map/trip-map-loader";
import {
  ApplyForm,
  LifecycleButtons,
  OfferButtons,
  ReviewForm,
} from "@/components/trips/trip-actions";
import { AiTripAnalysis } from "@/components/trips/ai-analysis";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { canChat, formatBaht, formatDate, formatTime } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { EmergencyContact, Offer, Profile, Review, Trip } from "@/lib/types";
import { TripSafety } from "@/components/trips/trip-safety";
import { NextStep } from "@/components/trips/next-step";
import { findConflicts, formatRange } from "@/lib/schedule";

export default async function TripDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { user, profile } = await requireProfile();

  const supabase = await createClient();
  const { data } = await supabase.from("trips").select("*").eq("id", id).maybeSingle();
  if (!data) notFound();
  const trip = data as Trip;

  const peopleIds = [trip.customer_id, trip.companion_id].filter(Boolean) as string[];
  const { data: people } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, phone, role")
    .in("id", peopleIds);
  const personMap = new Map(((people ?? []) as Profile[]).map((p) => [p.id, p]));
  const customer = personMap.get(trip.customer_id);
  const companion = trip.companion_id ? personMap.get(trip.companion_id) : null;

  const { data: offerRows } = await supabase
    .from("offers")
    .select("*")
    .eq("trip_id", id)
    .order("created_at", { ascending: false });
  const offers = (offerRows ?? []) as Offer[];
  const offerCompanionIds = offers.map((o) => o.companion_id);
  const { data: offerPeople } = offerCompanionIds.length
    ? await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", offerCompanionIds)
    : { data: [] };
  const offerNames = new Map(
    ((offerPeople ?? []) as Pick<Profile, "id" | "full_name">[]).map((p) => [p.id, p.full_name]),
  );

  const { data: reviewRows } = await supabase.from("reviews").select("*").eq("trip_id", id);
  const reviews = (reviewRows ?? []) as Review[];
  const myReview = reviews.find((r) => r.reviewer_id === user.id);

  const isCustomer = user.id === trip.customer_id;
  const isCompanion = user.id === trip.companion_id;
  const isApprovedCompanion =
    profile.role === "companion" && profile.verification_status === "approved";
  const alreadyApplied = offers.some((o) => o.companion_id === user.id);

  // Warn a companion before they take a job that overlaps one they already hold.
  let conflictWarning: string | undefined;
  if (profile.role === "companion" && !isCompanion && trip.status === "open") {
    const { data: committed } = await supabase
      .from("trips")
      .select("id, title, status, scheduled_date, start_time, duration_hours")
      .eq("companion_id", user.id)
      .eq("scheduled_date", trip.scheduled_date)
      .in("status", ["matched", "in_progress"]);
    const clash = findConflicts(trip, (committed ?? []) as Trip[])[0];
    if (clash) {
      conflictWarning = t("calendar.conflictWith", { title: clash.title, time: formatRange(clash) });
    }
  }
  const loc = await getLocale();

  const liveTrip = trip.status === "matched" || trip.status === "in_progress";
  let emergency: EmergencyContact | null = null;
  if (liveTrip && (isCustomer || isCompanion)) {
    const { data: contacts } = await supabase.rpc("get_trip_emergency_contact", { p_trip_id: trip.id });
    emergency = ((contacts ?? []) as EmergencyContact[])[0] ?? null;
  }
  const otherPerson = isCustomer ? companion : isCompanion ? customer : null;

  const origin =
    trip.origin_lat != null && trip.origin_lng != null
      ? { lat: trip.origin_lat, lng: trip.origin_lng }
      : null;
  const destination =
    trip.destination_lat != null && trip.destination_lng != null
      ? { lat: trip.destination_lat, lng: trip.destination_lng }
      : null;

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto grid w-full max-w-6xl flex-1 gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-flame">
            {t(`category.${trip.category}`)}
          </p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-4xl">{trip.title}</h1>
            <StatusPill value={trip.status} />
          </div>
          <div className="mt-4">
            <NextStep
              trip={trip}
              role={profile.role}
              isCustomer={isCustomer}
              isCompanion={isCompanion}
              pendingOffers={offers.filter((offer) => offer.status === "pending" && offer.initiated_by === "companion").length}
              hasReviewed={Boolean(myReview)}
            />
          </div>
          <p className="mt-4 max-w-prose text-ink-soft">{trip.details}</p>
          <div className="mt-8 rounded-[28px] bg-ink p-6 text-paper">
            <RouteRibbon
              from={`${trip.origin_label} · ${provinceName(trip.origin_province, loc)}`}
              to={`${trip.destination_label} · ${provinceName(trip.destination_province, loc)}`}
            />
          </div>
          <dl className="mt-6 grid gap-3 sm:grid-cols-3">
            <div>
              <dt className="text-sm text-ink-soft">{t("trip.when")}</dt>
              <dd className="font-display text-lg">
                {formatDate(trip.scheduled_date, loc)} {formatTime(trip.start_time, loc)}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">{t("trip.hours", { n: trip.duration_hours })}</dt>
              <dd className="font-display text-lg">
                {t("trip.hours", { n: Number(trip.duration_hours) })}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-ink-soft">{t("trip.pay")}</dt>
              <dd className="font-display text-lg">
                {formatBaht(Number(trip.offered_compensation), loc)}
              </dd>
            </div>
          </dl>
          {(origin || destination || (trip.status === "in_progress" && trip.last_lat != null)) && (
            <div className="mt-6">
              <TripMap
                origin={origin}
                destination={destination}
                current={
                  trip.status === "in_progress" && trip.last_lat != null && trip.last_lng != null
                    ? { lat: trip.last_lat, lng: trip.last_lng }
                    : null
                }
              />
            </div>
          )}
        </section>

        <aside className="grid h-fit gap-5">
          <div className="rounded-[28px] bg-mist p-5">
            <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">
              {t("trip.customer")}
            </p>
            <p className="mt-1 font-display text-2xl">{customer?.full_name}</p>
            {companion ? (
              <>
                <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">
                  {t("trip.companion")}
                </p>
                <p className="mt-1 font-display text-2xl">{companion.full_name}</p>
              </>
            ) : null}
          </div>

          <LifecycleButtons
            tripId={trip.id}
            status={trip.status}
            isCustomer={isCustomer}
            isCompanion={isCompanion}
          />

          {liveTrip && (isCustomer || isCompanion) ? (
            <TripSafety
              tripId={trip.id}
              status={trip.status}
              isCustomer={isCustomer}
              shareToken={isCustomer ? trip.share_token : null}
              lastLocatedAt={trip.last_located_at}
              emergency={emergency}
              otherParty={
                otherPerson
                  ? {
                      label: isCustomer ? t("trip.companion") : t("trip.customer"),
                      name: otherPerson.full_name,
                      phone: otherPerson.phone,
                    }
                  : null
              }
            />
          ) : null}

          {canChat(trip.status) ? (
            <ButtonLink href={`/trips/${trip.id}/chat`} variant="secondary">
              {t("trip.chat")}
            </ButtonLink>
          ) : null}

          {isCustomer && trip.status === "open" ? (
            <ButtonLink href={`/companions?trip=${trip.id}`} variant="ghost">
              {t("trip.invite")}
            </ButtonLink>
          ) : null}

          {isApprovedCompanion && !isCustomer && trip.status === "open" && !alreadyApplied ? (
            <ApplyForm tripId={trip.id} conflictWarning={conflictWarning} />
          ) : null}

          {(isCustomer || profile.role === "admin") && trip.status === "open" ? (
            <div>
              <h2 className="font-display text-xl">{t("trip.offers")}</h2>
              <ul className="mt-3 grid gap-3">
                {offers.length === 0 ? (
                  <li className="text-sm text-ink-soft">{t("trip.noOffers")}</li>
                ) : (
                  offers.map((offer) => (
                    <li key={offer.id} className="rounded-2xl bg-paper p-4">
                      <p className="font-semibold">
                        {offerNames.get(offer.companion_id) ?? offer.companion_id}
                      </p>
                      <p className="text-sm text-ink-soft">{offer.message || "—"}</p>
                      <div className="mt-2 flex items-center justify-between">
                        <StatusPill value={offer.status} />
                        {offer.status === "pending" ? (
                          <OfferButtons
                            offerId={offer.id}
                            canAccept={offer.initiated_by === "companion" && isCustomer}
                          />
                        ) : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          ) : null}

          {profile.role === "companion" &&
            offers
              .filter((o) => o.companion_id === user.id && o.status === "pending")
              .map((offer) =>
                offer.initiated_by === "customer" ? (
                  <OfferButtons key={offer.id} offerId={offer.id} canAccept conflictWarning={conflictWarning} />
                ) : null,
              )}

          {trip.status !== "cancelled" ? <AiTripAnalysis tripId={trip.id} /> : null}

          {trip.status === "completed" && (isCustomer || isCompanion) && !myReview ? (
            <ReviewForm
              tripId={trip.id}
              revieweeId={isCustomer ? (trip.companion_id as string) : trip.customer_id}
            />
          ) : null}
          {myReview ? (
            <p className="text-sm font-semibold text-ok">{t("review.done")}</p>
          ) : null}
        </aside>
      </main>
      <SiteFooter />
    </>
  );
}
