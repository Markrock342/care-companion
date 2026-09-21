import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect, Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { AdminActivity } from "@/components/admin/activity";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { AdminAction, Profile } from "@/lib/types";

export default async function AdminLogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const { profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/login", locale });

  const supabase = await createClient();
  const { data } = await supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(100);
  const rows = (data ?? []) as AdminAction[];

  const ids = [...rows.map((row) => row.admin_id), ...rows.map((row) => row.target_user)].filter(Boolean) as string[];
  const names = new Map<string, string>();
  if (ids.length) {
    const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", ids);
    for (const person of (people ?? []) as Pick<Profile, "id" | "full_name">[]) names.set(person.id, person.full_name);
  }

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:py-10">
        <Link href="/admin" className="text-sm font-semibold text-flame">
          ← {t("title")}
        </Link>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t("log")}</h1>
        <p className="mt-1 mb-6 text-sm text-ink-soft">{t("logHint")}</p>
        <AdminActivity rows={rows} names={names} />
      </main>
      <SiteFooter />
    </>
  );
}
