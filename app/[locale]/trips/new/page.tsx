import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { TripForm } from "@/components/trips/trip-form";
import { requireProfile } from "@/lib/auth";

export default async function NewTripPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ companion?: string }>;
}) {
  const { locale } = await params;
  const { companion } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("tripForm");
  const { profile } = await requireProfile();
  if (profile.role !== "customer" && profile.role !== "admin") {
    redirect({ href: "/companion", locale });
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <div className="mt-8">
          <TripForm inviteCompanionId={companion} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
