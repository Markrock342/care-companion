import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "./language-switcher";
import { SignOutButton } from "./sign-out-button";
import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/ui/avatar";
import { getAuthState, dashboardPath } from "@/lib/auth";

export async function SiteHeader({ variant = "marketing" }: { variant?: "marketing" | "app" }) {
  const t = await getTranslations("nav");
  const { profile } = await getAuthState();

  const links =
    variant === "marketing"
      ? [
          { href: "/#how", label: t("how") },
          { href: "/companions", label: t("companions") },
        ]
      : [
          ...(profile ? [{ href: dashboardPath(profile.role), label: t("home") }] : []),
          { href: "/companions", label: t("companions") },
          ...(profile?.role === "admin" ? [{ href: "/admin", label: t("admin") }] : []),
        ];

  return (
    <header className="sticky top-0 z-[var(--z-sticky)] border-b border-line/60 bg-paper/85 backdrop-blur-md">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-[var(--z-skip)] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-paper"
      >
        {t("skip")}
      </a>
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 md:h-20">
        <Wordmark />
        <nav className="hidden items-center gap-6 text-sm font-semibold md:flex">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-flame">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSwitcher />
          {profile ? (
            <>
              <Link
                href="/account"
                aria-label={t("profile")}
                className="flex items-center gap-2 rounded-full py-1 pl-1 pr-1 hover:bg-mist md:pr-3"
              >
                <Avatar name={profile.full_name} src={profile.avatar_url} className="size-9 text-xs" />
                <span className="hidden max-w-32 truncate text-sm font-semibold md:block">
                  {profile.full_name}
                </span>
              </Link>
              <span className="hidden md:block">
                <SignOutButton />
              </span>
            </>
          ) : (
            <ButtonLink href="/login" size="sm" className="whitespace-nowrap">
              {t("login")}
            </ButtonLink>
          )}
        </div>
      </div>
      {/* Phones: the same links as a scrollable row under the bar. */}
      <nav className="-mt-1 flex gap-2 overflow-x-auto px-4 pb-3 text-sm font-semibold md:hidden">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="shrink-0 rounded-full bg-mist px-4 py-2 hover:text-flame"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

export async function SiteFooter() {
  const t = await getTranslations("footer");
  return (
    <footer className="mt-auto border-t border-line/70 bg-plate text-on-accent">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-display text-lg">Care Companion</p>
        <p className="text-sm text-on-accent">{t("disclaimer")}</p>
        <Link href="/privacy" className="text-sm underline-offset-4 hover:underline">
          {t("privacy")}
        </Link>
      </div>
    </footer>
  );
}
