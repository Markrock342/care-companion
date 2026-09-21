import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthState, dashboardPath } from "@/lib/auth";

export default async function LoginPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("login");
  const { user, profile } = await getAuthState();
  if (user && profile) {
    redirect({ href: dashboardPath(profile.role), locale });
  }
  if (user && !profile) {
    redirect({ href: "/onboarding", locale });
  }

  return (
    <>
      <SiteHeader />
      <main
        id="main"
        className="mx-auto grid w-full max-w-xl flex-1 place-items-center px-[var(--space-md)] py-[var(--space-xl)] md:py-[var(--space-3xl)]"
      >
        <div className="flex w-full flex-col items-center gap-[var(--space-lg)]">
          <div className="flex flex-col items-center gap-[var(--space-sm)] text-center">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-flame">Google</p>
            <h1 className="text-h1">{t("title")}</h1>
            <p className="max-w-[36rem] text-ink-soft">{t("body")}</p>
          </div>
          <LoginForm />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
