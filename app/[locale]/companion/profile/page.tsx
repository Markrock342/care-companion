import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { requireProfile } from "@/lib/auth";
import { CompanionProfileForm } from "@/components/auth/companion-profile-form";

export default async function CompanionProfilePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("companionDash");
  const { profile } = await requireProfile();
  if (profile.role !== "companion") redirect({ href: "/customer", locale });

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("editProfile")}</h1>
        <div className="mt-8">
          <CompanionProfileForm profile={profile} />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
