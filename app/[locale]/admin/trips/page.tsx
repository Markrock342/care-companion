import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { redirect, Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { StatusPill } from "@/components/ui/status-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChips } from "@/components/admin/filter-chips";
import { AdminTripActions } from "@/components/admin/trip-actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBaht, formatDate, formatTime } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { Profile, Trip, TripStatus } from "@/lib/types";

const STATUSES: (TripStatus | "")[] = ["", "open", "matched", "in_progress", "completed", "cancelled"];

export default async function AdminTripsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tt = await getTranslations("trip");
  const tc = await getTranslations("category");
  const ts = await getTranslations("status");
  const loc = await getLocale();
  const { profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/login", locale });

  const status = STATUSES.includes(query.status as TripStatus) ? (query.status ?? "") : "";
  const search = (query.q ?? "").trim();

  const supabase = await createClient();
  let request = supabase.from("trips").select("*").order("scheduled_date", { ascending: false }).limit(200);
  if (status) request = request.eq("status", status);
  if (search) request = request.ilike("title", `%${search}%`);
  const { data } = await request;
  const trips = (data ?? []) as Trip[];

  const peopleIds = [...new Set(trips.flatMap((trip) => [trip.customer_id, trip.companion_id]).filter(Boolean))] as string[];
  const names = new Map<string, string>();
  if (peopleIds.length) {
    const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", peopleIds);
    for (const person of (people ?? []) as Pick<Profile, "id" | "full_name">[]) names.set(person.id, person.full_name);
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Link href="/admin" className="text-sm font-semibold text-flame">
          ← {t("title")}
        </Link>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t("trips")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("tripsPageHint")}</p>

        <form action="" className="mt-5 flex gap-2">
          {status ? <input type="hidden" name="status" value={status} /> : null}
          <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-mist px-4">
            <MagnifyingGlass className="size-5 shrink-0 text-ink-soft" aria-hidden />
            <span className="sr-only">{t("searchTrips")}</span>
            <input type="search" name="q" defaultValue={search} placeholder={t("searchTrips")} className="w-full bg-transparent outline-none" />
          </label>
          <button type="submit" className="h-12 shrink-0 rounded-full bg-ink px-5 font-semibold text-paper">
            {t("search")}
          </button>
        </form>

        <div className="mt-4">
          <FilterChips
            basePath="/admin/trips"
            param="status"
            current={status}
            params={{ status, q: search }}
            options={[{ value: "", label: t("allStatuses") }, ...STATUSES.filter(Boolean).map((value) => ({ value: value as string, label: ts(value as string) }))]}
          />
        </div>

        <p className="mt-4 text-sm text-ink-soft">{t("found", { n: trips.length })}</p>

        {trips.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t("emptyTrips")} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {trips.map((trip) => (
              <li key={trip.id} className="rounded-[24px] bg-paper p-4 shadow-[var(--shadowRaise)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold uppercase tracking-[0.16em] text-flame">{tc(trip.category)}</p>
                    <Link href={`/trips/${trip.id}`} className="font-display text-xl underline-offset-4 hover:underline">
                      {trip.title}
                    </Link>
                    <p className="mt-1 text-sm text-ink-soft">
                      {formatDate(trip.scheduled_date, loc)} {formatTime(trip.start_time, loc)} ·{" "}
                      {provinceName(trip.origin_province, loc)} → {provinceName(trip.destination_province, loc)} ·{" "}
                      {formatBaht(Number(trip.offered_compensation), loc)}
                    </p>
                    <p className="text-sm text-ink-soft">
                      {tt("customer")}: {names.get(trip.customer_id) ?? "—"}
                      {" · "}
                      {tt("companion")}: {trip.companion_id ? (names.get(trip.companion_id) ?? "—") : t("noCompanion")}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusPill value={trip.status} />
                    <AdminTripActions tripId={trip.id} canCancel={trip.status !== "completed" && trip.status !== "cancelled"} />
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
