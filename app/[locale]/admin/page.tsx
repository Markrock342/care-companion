import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminUserActions } from "@/components/admin/user-actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Trip } from "@/lib/types";

export default async function AdminHome({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const { profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/customer", locale });

  const supabase = await createClient();
  const { data: users } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const { data: trips } = await supabase.from("trips").select("id, status");
  const pending = ((users ?? []) as Profile[]).filter(
    (item) => item.role === "companion" && item.verification_status === "pending",
  );
  const tripRows = (trips ?? []) as Pick<Trip, "id" | "status">[];

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("title")}</h1>
        <p className="mt-2 text-sm text-ink-soft">{t("promoteHint")}</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label={t("users")} value={(users ?? []).length} />
          <Stat label={t("trips")} value={tripRows.length} />
          <Stat label={t("pending")} value={pending.length} />
        </div>

        <div className="mt-6 flex gap-3">
          <ButtonLink href="/admin/users" variant="secondary">
            {t("users")}
          </ButtonLink>
          <ButtonLink href="/admin/trips" variant="ghost">
            {t("trips")}
          </ButtonLink>
        </div>

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("pending")}</h2>
          {pending.length === 0 ? (
            <div className="mt-4">
              <EmptyState title={t("emptyPending")} />
            </div>
          ) : (
            <ul className="mt-4 grid gap-3">
              {pending.map((item) => (
                <li
                  key={item.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-[24px] bg-paper p-4 shadow-[var(--shadow-raise)]"
                >
                  <div>
                    <p className="font-display text-xl">{item.full_name}</p>
                    <p className="text-sm text-ink-soft">{item.bio}</p>
                    <StatusPill value={item.verification_status} />
                  </div>
                  <AdminUserActions userId={item.id} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[24px] bg-ink p-5 text-paper">
      <p className="text-sm uppercase tracking-[0.16em] text-gold">{label}</p>
      <p className="mt-2 font-display text-4xl">{value}</p>
    </div>
  );
}
