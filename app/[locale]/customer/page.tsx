import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { TripCard } from "@/components/trips/trip-card";
import { CompanionPlate } from "@/components/companions/companion-plate";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanionCards } from "@/lib/queries";
import { rankCompanions } from "@/lib/matching";
import type { Trip } from "@/lib/types";

export default async function CustomerHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("customer");
  const { user, profile } = await requireProfile();
  if (profile.role === "admin") redirect({ href: "/admin", locale });
  if (profile.role === "companion") redirect({ href: "/companion", locale });

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("*")
    .eq("customer_id", user.id)
    .order("scheduled_date", { ascending: false });
  const trips = (data ?? []) as Trip[];
  const latestOpen = trips.find((trip) => trip.status === "open");

  let suggested: Awaited<ReturnType<typeof fetchCompanionCards>> = [];
  if (latestOpen) {
    const cards = await fetchCompanionCards(supabase);
    suggested = rankCompanions(cards, latestOpen).slice(0, 3);
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-flame">
              {profile.full_name}
            </p>
            <h1 className="mt-1 font-display text-4xl">{t("title")}</h1>
          </div>
          <ButtonLink href="/trips/new">{t("new")}</ButtonLink>
        </div>

        <div className="mt-8 grid gap-4">
          {trips.length === 0 ? (
            <EmptyState
              title={t("empty")}
              hint={t("emptyHint")}
              action={<ButtonLink href="/trips/new">{t("new")}</ButtonLink>}
            />
          ) : (
            trips.map((trip) => <TripCard key={trip.id} trip={trip} />)
          )}
        </div>

        {suggested.length > 0 ? (
          <section className="mt-12">
            <h2 className="font-display text-2xl">{t("suggested")}</h2>
            <div className="mt-5 grid gap-5 md:grid-cols-3">
              {suggested.map((companion) => (
                <CompanionPlate
                  key={companion.id}
                  companion={companion}
                  href={`/companions/${companion.id}?trip=${latestOpen?.id}`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </main>
      <SiteFooter />
    </>
  );
}
