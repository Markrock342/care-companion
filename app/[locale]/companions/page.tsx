import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { CompanionPlate } from "@/components/companions/companion-plate";
import { EmptyState } from "@/components/ui/empty-state";
import { PROVINCES, provinceName } from "@/lib/provinces";
import { createClient } from "@/lib/supabase/server";
import { fetchCompanionCards } from "@/lib/queries";
import { getSupabaseEnv } from "@/lib/supabase/config";

export default async function CompanionsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string; province?: string; trip?: string }>;
}) {
  const { locale } = await params;
  const { q = "", province = "", trip } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("companions");

  let cards: Awaited<ReturnType<typeof fetchCompanionCards>> = [];
  if (getSupabaseEnv().configured) {
    const supabase = await createClient();
    cards = await fetchCompanionCards(supabase);
  }

  const filtered = cards.filter((companion) => {
    const hay = `${companion.full_name} ${companion.bio ?? ""} ${companion.service_provinces.join(" ")}`.toLowerCase();
    const matchQ = q ? hay.includes(q.toLowerCase()) : true;
    const matchP = province
      ? companion.service_provinces.includes(province) || companion.service_provinces.length === 0
      : true;
    return matchQ && matchP;
  });

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <form className="mt-6 flex flex-wrap gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder={t("search")}
            className="h-12 min-w-56 flex-1 rounded-full bg-mist px-4"
          />
          <select
            name="province"
            defaultValue={province}
            className="h-12 rounded-full bg-mist px-4"
          >
            <option value="">{t("province")}</option>
            {PROVINCES.map((item) => (
              <option key={item.id} value={item.id}>
                {provinceName(item.id, locale)}
              </option>
            ))}
          </select>
          {trip ? <input type="hidden" name="trip" value={trip} /> : null}
          <button className="h-12 rounded-full bg-ink px-5 font-semibold text-paper cursor-pointer">
            {t("searchBtn")}
          </button>
        </form>

        {filtered.length === 0 ? (
          <div className="mt-8">
            <EmptyState title={t("empty")} hint={t("emptyHint")} />
          </div>
        ) : (
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((companion) => (
              <CompanionPlate
                key={companion.id}
                companion={companion}
                href={
                  trip
                    ? `/companions/${companion.id}?trip=${trip}`
                    : `/companions/${companion.id}`
                }
              />
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
