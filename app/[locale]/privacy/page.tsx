import { getTranslations, setRequestLocale } from "next-intl/server";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";

export default async function PrivacyPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");
  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-2xl flex-1 px-4 py-16">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="mt-4 max-w-prose text-lg text-ink-soft">{t("body")}</p>
      </main>
      <SiteFooter />
    </>
  );
}
