import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, Phone, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { AutoRefresh } from "@/components/motion/auto-refresh";
import { TripMap } from "@/components/map/trip-map-loader";
import { RouteRibbon } from "@/components/brand/logo";
import { Avatar } from "@/components/ui/avatar";
import { StatusPill } from "@/components/ui/status-pill";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import { formatRange } from "@/lib/schedule";
import type { TripStatus } from "@/lib/types";

export const metadata: Metadata = { robots: { index: false, follow: false } };

type SharedTrip = {
  title: string;
  category: string;
  status: TripStatus;
  scheduled_date: string;
  start_time: string;
  duration_hours: number;
  origin_label: string;
  origin_province: string;
  origin_lat: number | null;
  origin_lng: number | null;
  destination_label: string;
  destination_province: string;
  destination_lat: number | null;
  destination_lng: number | null;
  last_lat: number | null;
  last_lng: number | null;
  last_located_at: string | null;
  updated_at: string;
  customer_name: string;
  companion_name: string | null;
  companion_avatar: string | null;
  companion_phone: string | null;
};

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function SharedTripPage({ params }: { params: Promise<{ locale: string; token: string }> }) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("share");
  const tAll = await getTranslations();

  let trip: SharedTrip | null = null;
  if (UUID.test(token)) {
    const supabase = await createClient();
    const { data } = await supabase.rpc("get_shared_trip", { p_token: token });
    trip = (data as SharedTrip | null) ?? null;
  }

  if (!trip) {
    return (
      <>
        <SiteHeader />
        <main id="main" className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-4 py-20 text-center">
          <div>
            <ShieldCheck className="mx-auto size-12 text-ink-soft" aria-hidden />
            <h1 className="mt-4 font-display text-3xl">{t("expiredTitle")}</h1>
            <p className="mt-2 text-ink-soft">{t("expiredBody")}</p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const live = trip.status === "in_progress";
  const origin = trip.origin_lat != null && trip.origin_lng != null ? { lat: trip.origin_lat, lng: trip.origin_lng } : null;
  const destination =
    trip.destination_lat != null && trip.destination_lng != null ? { lat: trip.destination_lat, lng: trip.destination_lng } : null;
  const current = live && trip.last_lat != null && trip.last_lng != null ? { lat: trip.last_lat, lng: trip.last_lng } : null;

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto grid w-full max-w-3xl flex-1 gap-6 px-4 py-10">
        {trip.status !== "completed" ? <AutoRefresh seconds={30} /> : null}
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-flame">{t("eyebrow", { name: trip.customer_name })}</p>
          <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
            <h1 className="font-display text-4xl">{trip.title}</h1>
            <StatusPill value={trip.status} />
          </div>
          <p className="mt-2 text-ink-soft">{t(`statusLine.${trip.status}`)}</p>
        </div>

        <div className="rounded-[28px] bg-ink p-6 text-paper">
          <RouteRibbon
            from={`${trip.origin_label} · ${provinceName(trip.origin_province, locale)}`}
            to={`${trip.destination_label} · ${provinceName(trip.destination_province, locale)}`}
          />
        </div>

        <dl className="grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-3 rounded-2xl bg-mist p-4">
            <Clock className="mt-0.5 size-5 text-flame" aria-hidden />
            <div>
              <dt className="text-sm text-ink-soft">{tAll("trip.when")}</dt>
              <dd className="font-semibold">
                {formatDate(trip.scheduled_date, locale)} · {formatRange(trip)}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 rounded-2xl bg-mist p-4">
            <MapPin className="mt-0.5 size-5 text-[#2563eb]" aria-hidden />
            <div>
              <dt className="text-sm text-ink-soft">{t("lastLocation")}</dt>
              <dd className="font-semibold">
                {current && trip.last_located_at ? formatDateTime(trip.last_located_at, locale) : t("noLocation")}
              </dd>
            </div>
          </div>
        </dl>

        {origin || destination || current ? <TripMap origin={origin} destination={destination} current={current} className="h-80" /> : null}
        {current ? (
          <a
            href={`https://www.google.com/maps?q=${current.lat},${current.lng}`}
            target="_blank"
            rel="noreferrer"
            className="justify-self-start text-sm font-semibold text-flame underline-offset-2 hover:underline"
          >
            {t("openInMaps")}
          </a>
        ) : null}

        {trip.companion_name ? (
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-paper p-5 shadow-[var(--shadowRaise)]">
            <div className="flex items-center gap-3">
              <Avatar name={trip.companion_name} src={trip.companion_avatar} className="size-14 text-lg" />
              <div>
                <p className="text-sm text-ink-soft">{tAll("trip.companion")}</p>
                <p className="font-display text-xl">{trip.companion_name}</p>
              </div>
            </div>
            {trip.companion_phone ? (
              <a href={`tel:${trip.companion_phone}`} className="flex items-center gap-2 rounded-full bg-ink px-4 py-2.5 font-semibold text-paper">
                <Phone weight="fill" className="size-4" aria-hidden />
                {t("callCompanion")}
              </a>
            ) : null}
          </section>
        ) : null}

        <a href="tel:1669" className="flex items-center justify-center gap-2 rounded-2xl bg-danger px-4 py-3 font-semibold text-paper">
          <Phone weight="fill" className="size-5" aria-hidden />
          {t("call1669")}
        </a>
        <p className="text-center text-xs text-ink-soft">{t("privacy")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
