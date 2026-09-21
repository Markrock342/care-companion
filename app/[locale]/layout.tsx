import type { CSSProperties } from "react";
import type { Metadata } from "next";
import { Anuphan, Chakra_Petch } from "next/font/google";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { ThemeScript } from "@/components/theme/theme-script";
import "../globals.css";

const anuphan = Anuphan({
  subsets: ["latin", "thai"],
  variable: "--font-anuphan",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const chakra = Chakra_Petch({
  subsets: ["latin", "thai"],
  variable: "--font-chakra",
  display: "swap",
  weight: ["500", "600", "700"],
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });
  return {
    title: t("title"),
    description: t("description"),
    icons: { icon: "/logo.png" },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`${anuphan.variable} ${chakra.variable} h-full antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body
        className="flex min-h-full flex-col font-sans"
        style={
          {
            "--font-body": "var(--font-anuphan)",
            "--font-display": "var(--font-chakra)",
          } as CSSProperties
        }
      >
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
