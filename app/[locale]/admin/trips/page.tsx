import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { TripCard } from "@/components/trips/trip-card";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Trip } from "@/lib/types";

export default async function AdminTripsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const { profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/login", locale });

  const supabase = await createClient();
  const { data } = await supabase
    .from("trips")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("trips")}</h1>
        <div className="mt-6 grid gap-4">
          {((data ?? []) as Trip[]).map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
