import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { CompanionPlate } from "@/components/companions/companion-plate";
import { getAuthState } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanionCards, fetchReviewsFor } from "@/lib/queries";
import { provinceName } from "@/lib/provinces";
import { WEEKDAYS } from "@/lib/constants";
import { InviteButton } from "@/components/companions/invite-button";

export default async function CompanionProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string; id: string }>;
  searchParams: Promise<{ trip?: string }>;
}) {
  const { locale, id } = await params;
  const { trip } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { profile } = await getAuthState();
  const supabase = await createClient();
  const cards = await fetchCompanionCards(supabase, { approvedOnly: false });
  const companion = cards.find((item) => item.id === id);
  if (!companion) notFound();
  const reviews = await fetchReviewsFor(supabase, id);

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto grid w-full max-w-4xl flex-1 gap-8 px-4 py-10">
        <CompanionPlate companion={companion} />
        <section className="rounded-[28px] bg-mist p-6">
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">
            {t("onboarding.provinces")}
          </p>
          <p className="mt-2">
            {companion.service_provinces.map((p) => provinceName(p, locale)).join(" · ") || "—"}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">
            {t("onboarding.days")}
          </p>
          <p className="mt-2">
            {WEEKDAYS.filter((d) => companion.available_days.includes(d))
              .map((d) => t(`weekday.${d}`))
              .join(" ") || "—"}
          </p>
          <p className="mt-4 text-sm font-bold uppercase tracking-[0.16em] text-ink-soft">
            {t("onboarding.skills")}
          </p>
          <p className="mt-2">
            {companion.skills.map((s) => t(`skill.${s}`)).join(" · ") || "—"}
          </p>
        </section>

        {profile?.role === "customer" ? (
          trip ? (
            <InviteButton tripId={trip} companionId={companion.id} />
          ) : (
            <ButtonLink href={`/trips/new?companion=${companion.id}`}>
              {t("companions.invite")}
            </ButtonLink>
          )
        ) : null}

        <section>
          <h2 className="font-display text-2xl">{t("companions.reviews", { n: reviews.length })}</h2>
          <ul className="mt-4 grid gap-3">
            {reviews.map((review) => (
              <li key={review.id} className="rounded-2xl bg-paper p-4 shadow-[var(--shadow-raise)]">
                <p className="font-display text-lg">
                  {review.rating}/5 · {review.reviewer?.full_name}
                </p>
                <p className="mt-1 text-ink-soft">{review.comment}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
