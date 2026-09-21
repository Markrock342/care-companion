import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { OnboardingForm } from "@/components/auth/onboarding-form";
import { dashboardPath, requireUser } from "@/lib/auth";

export default async function OnboardingPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("onboarding");
  const { user, profile } = await requireUser();
  if (profile) redirect({ href: dashboardPath(profile.role), locale });

  const defaultName =
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email?.split("@")[0] ??
    "";

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-12">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="mt-2 text-ink-soft">{t("subtitle")}</p>
        <div className="mt-8">
          <OnboardingForm defaultName={defaultName} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
