import type { CSSProperties } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { LearnMoreLink } from "@/components/uiverse/learn-more";
import { StatStrip } from "@/components/landing/stat-strip";
import { GlobeStage } from "@/components/landing/globe-stage";
import { HoloTicket } from "@/components/landing/holo-ticket";
import { OrbitCards } from "@/components/landing/orbit-cards";
import { CompanionPlate } from "@/components/companions/companion-plate";
import { Reveal } from "@/components/motion/reveal";
import { Typewriter } from "@/components/motion/typewriter";
import { getAuthState, dashboardPath } from "@/lib/auth";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanionCards } from "@/lib/queries";

export default async function LandingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("landing");
  const category = await getTranslations("category");
  const skill = await getTranslations("skill");
  const { profile } = await getAuthState();
  const startHref = profile ? dashboardPath(profile.role) : "/login";

  let plates: Awaited<ReturnType<typeof fetchCompanionCards>> = [];
  if (getSupabaseEnv().configured) {
    try {
      const supabase = await createClient();
      plates = (await fetchCompanionCards(supabase)).slice(0, 3);
    } catch {
      plates = [];
    }
  }

  const steps = [1, 2, 3] as const;
  const errands = ["hospital", "doctor", "bank", "government", "shopping"] as const;

  return (
    <>
      <SiteHeader />
      <main id="main">
        <section className="relative overflow-hidden">
          <div className="mx-auto grid min-h-[calc(100svh-5rem)] max-w-6xl items-center gap-[var(--space-lg)] px-[var(--space-md)] py-[var(--space-lg)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="relative z-10 flex flex-col items-start gap-[var(--space-lg)]">
              <div className="flex flex-col gap-[var(--space-sm)]">
                <p
                  className="reveal text-sm font-bold uppercase tracking-[0.22em] text-flame"
                  style={{ "--i": 0 } as CSSProperties}
                >
                  {t("eyebrow")}
                </p>
                <h1
                  className="reveal text-display"
                  style={{ "--i": 1 } as CSSProperties}
                >
                  <span className="block">{t("headlineLead")}</span>
                  <Typewriter
                    className="block text-flame"
                    phrases={t.raw("headlineRotate") as string[]}
                  />
                  <span className="sr-only">{t("headline")}</span>
                </h1>
                <p
                  className="reveal max-w-[36rem] text-lg text-ink-soft"
                  style={{ "--i": 2 } as CSSProperties}
                >
                  {t("sub")}
                </p>
              </div>
              <div
                className="reveal flex flex-wrap items-center gap-[var(--space-md)]"
                style={{ "--i": 3 } as CSSProperties}
              >
                <LearnMoreLink href={startHref}>{t("cta")}</LearnMoreLink>
                <ButtonLink href="/login" variant="secondary" size="lg">
                  {t("ctaSecondary")}
                </ButtonLink>
              </div>
              <div className="reveal" style={{ "--i": 4 } as CSSProperties}>
                <HoloTicket
                  title={t("ticketTitle")}
                  date={t("ticketDate")}
                  from={t("routeFrom")}
                  to={t("routeTo")}
                  seat={t("ticketSeat")}
                />
              </div>
            </div>
            <GlobeStage pin={t("globePin")} hint={t("globeHint")} />
          </div>
        </section>

        <section className="bg-ink">
          <StatStrip />
          <div className="mx-auto flex max-w-6xl flex-col gap-[var(--space-sm)] px-[var(--space-md)] pb-[var(--space-lg)] text-sm text-paper sm:flex-row sm:justify-between">
            <p>{t("trust1")}</p>
            <p>{t("trust2")}</p>
            <p>{t("trust3")}</p>
          </div>
        </section>

        <section className="overflow-hidden py-[var(--space-3xl)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-[var(--space-lg)] px-[var(--space-md)]">
            <Reveal>
              <h2 className="text-h2">{t("orbitTitle")}</h2>
              <p className="mt-[var(--space-sm)] max-w-[40rem] text-ink-soft">{t("orbitBody")}</p>
            </Reveal>
            <OrbitCards
              labels={[
                category("hospital"),
                category("doctor"),
                category("bank"),
                category("government"),
                category("shopping"),
                category("other"),
                skill("walking"),
                skill("wheelchair"),
                skill("documents"),
                skill("queue"),
              ]}
            />
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-[var(--space-2xl)] px-[var(--space-md)] py-[var(--space-4xl)] lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)] lg:items-end">
          <Reveal>
            <h2 className="text-h2">{t("painTitle")}</h2>
            <p className="mt-[var(--space-md)] max-w-[40rem] text-lg text-ink-soft">
              {t("painBody")}
            </p>
          </Reveal>
          <Reveal delay={80}>
            <ol className="grid">
              {errands.map((key, index) => (
                <li
                  key={key}
                  className="flex items-baseline gap-[var(--space-md)] border-b border-line py-[var(--space-sm)] last:border-b-0"
                >
                  <span className="w-8 shrink-0 font-display text-sm font-bold text-flame">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="font-display text-xl">
                    <CategoryLabel name={key} />
                  </span>
                </li>
              ))}
            </ol>
          </Reveal>
        </section>

        <section id="how" className="scroll-mt-24 bg-mist py-[var(--space-4xl)]">
          <div className="mx-auto flex max-w-6xl flex-col gap-[var(--space-2xl)] px-[var(--space-md)]">
            <Reveal>
              <h2 className="text-h2">{t("howTitle")}</h2>
            </Reveal>
            <ol className="grid gap-[var(--space-lg)] md:sr-only">
              {steps.map((step) => (
                <li key={step} className="flex gap-[var(--space-md)]">
                  <p className="font-display text-5xl leading-none text-flame">{step}</p>
                  <div className="flex flex-col gap-[var(--space-xs)]">
                    <h3 className="font-display text-2xl">{t(`how${step}Title`)}</h3>
                    <p className="text-ink-soft">{t(`how${step}Body`)}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Reveal delay={60}>
              <div className="hidden md:flex md:items-start" aria-hidden>
                {steps.flatMap((step, index) => {
                  const block = (
                    <div key={step} className="max-w-[16rem] min-w-0 shrink-0 grow">
                      <p className="font-display text-5xl leading-none text-flame">{step}</p>
                      <h3 className="mt-[var(--space-sm)] font-display text-2xl">
                        {t(`how${step}Title`)}
                      </h3>
                      <p className="mt-[var(--space-xs)] max-w-[22rem] text-ink-soft">
                        {t(`how${step}Body`)}
                      </p>
                    </div>
                  );
                  if (index === steps.length - 1) return [block];
                  return [
                    block,
                    <div
                      key={`route-${step}`}
                      className="route-stem-x mx-3 mt-7 h-[2px] min-w-10 flex-1 bg-[repeating-linear-gradient(90deg,var(--colorFlame)_0_8px,transparent_8px_14px)]"
                      aria-hidden
                    />,
                  ];
                })}
              </div>
            </Reveal>
          </div>
        </section>

        {plates.length > 0 ? (
          <section className="mx-auto flex max-w-6xl flex-col gap-[var(--space-xl)] px-[var(--space-md)] py-[var(--space-4xl)]">
            <Reveal>
              <h2 className="text-h2">{t("plateTitle")}</h2>
            </Reveal>
            <div className="grid gap-[var(--space-lg)] [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
              {plates.map((companion, index) => (
                <Reveal key={companion.id} delay={index * 70}>
                  <CompanionPlate companion={companion} href={`/companions/${companion.id}`} />
                </Reveal>
              ))}
            </div>
          </section>
        ) : null}

        <section className="px-[var(--space-md)] pb-[var(--space-4xl)]">
          <Reveal>
            <div className="mx-auto grid max-w-6xl place-items-center rounded-[36px] bg-flame px-[var(--space-lg)] py-[var(--space-3xl)] text-center text-on-accent">
              <div className="flex flex-col items-center gap-[var(--space-lg)]">
                <h2 className="font-display text-[clamp(1.75rem,6vw,3.5rem)] leading-none">
                  {t("finalTitle")}
                </h2>
                <p className="max-w-[40rem] text-on-accent">{t("disclaimer")}</p>
                <ButtonLink href={startHref} variant="plate" size="lg">
                  {t("cta")}
                </ButtonLink>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

async function CategoryLabel({ name }: { name: string }) {
  const t = await getTranslations("category");
  return t(name);
}
