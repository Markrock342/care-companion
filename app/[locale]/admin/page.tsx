import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { ChartBar, Clock, Coins, Star, UsersThree, WarningCircle } from "@phosphor-icons/react/dist/ssr";
import { redirect, Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { AdminUserActions } from "@/components/admin/user-actions";
import { StatCard } from "@/components/admin/stat-card";
import { BreakdownBars, WeeklyBars } from "@/components/admin/bar-chart";
import { AdminActivity } from "@/components/admin/activity";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatBaht } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { AdminAction, AdminStats, Profile } from "@/lib/types";

export default async function AdminHome({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tc = await getTranslations("category");
  const loc = await getLocale();
  const { user, profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/customer", locale });

  const supabase = await createClient();
  const [{ data: statsData }, { data: pendingRows }, { data: logRows }] = await Promise.all([
    supabase.rpc("admin_stats"),
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "companion")
      .eq("verification_status", "pending")
      .order("created_at", { ascending: true }),
    supabase.from("admin_actions").select("*").order("created_at", { ascending: false }).limit(8),
  ]);

  const stats = statsData as AdminStats | null;
  const pending = (pendingRows ?? []) as Profile[];
  const log = (logRows ?? []) as AdminAction[];

  const names = new Map<string, string>();
  const referenced = [...log.map((row) => row.admin_id), ...log.map((row) => row.target_user)].filter(Boolean) as string[];
  if (referenced.length) {
    const { data: people } = await supabase.from("profiles").select("id, full_name").in("id", referenced);
    for (const person of (people ?? []) as Pick<Profile, "id" | "full_name">[]) names.set(person.id, person.full_name);
  }

  const weekFormat = new Intl.DateTimeFormat(loc === "th" ? "th-TH" : "en-GB", { day: "numeric", month: "short" });
  const completionRate = stats && stats.trips.total > 0 ? Math.round((stats.trips.completed / stats.trips.total) * 100) : 0;

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl sm:text-4xl">{t("title")}</h1>
            <p className="mt-1 text-sm text-ink-soft">{t("subtitle")}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/admin/users" size="sm" variant="secondary">
              {t("manageUsers")}
            </ButtonLink>
            <ButtonLink href="/admin/trips" size="sm" variant="ghost">
              {t("manageTrips")}
            </ButtonLink>
            <ButtonLink href="/admin/log" size="sm" variant="ghost">
              {t("log")}
            </ButtonLink>
          </div>
        </div>

        {/* What needs attention, first and in plain words */}
        {stats && (stats.users.pending_companions > 0 || stats.trips.in_progress > 0 || stats.reviews.low_ratings > 0) ? (
          <ul className="mt-6 grid gap-2 sm:grid-cols-3">
            {stats.users.pending_companions > 0 ? (
              <li>
                <Link href="/admin/users?verification=pending" className="flex items-center gap-3 rounded-2xl bg-gold px-4 py-3 font-semibold text-ink">
                  <Clock weight="fill" className="size-5 shrink-0" aria-hidden />
                  {t("todoPending", { n: stats.users.pending_companions })}
                </Link>
              </li>
            ) : null}
            {stats.trips.in_progress > 0 ? (
              <li>
                <Link href="/admin/trips?status=in_progress" className="flex items-center gap-3 rounded-2xl bg-flame px-4 py-3 font-semibold text-paper">
                  <ChartBar weight="fill" className="size-5 shrink-0" aria-hidden />
                  {t("todoLive", { n: stats.trips.in_progress })}
                </Link>
              </li>
            ) : null}
            {stats.reviews.low_ratings > 0 ? (
              <li className="flex items-center gap-3 rounded-2xl bg-mist px-4 py-3 font-semibold">
                <WarningCircle weight="fill" className="size-5 shrink-0 text-danger" aria-hidden />
                {t("todoLowRatings", { n: stats.reviews.low_ratings })}
              </li>
            ) : null}
          </ul>
        ) : null}

        {stats ? (
          <>
            <section className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label={t("kpis")}>
              <StatCard
                label={t("users")}
                value={stats.users.total}
                hint={t("usersHint", { customers: stats.users.customers, companions: stats.users.companions, new: stats.users.new_7d })}
                icon={<UsersThree weight="fill" className="size-5" />}
              />
              <StatCard
                label={t("trips")}
                value={stats.trips.total}
                hint={t("tripsHint", { open: stats.trips.open, live: stats.trips.in_progress, new: stats.trips.new_7d })}
                tone="paper"
                icon={<ChartBar weight="fill" className="size-5 text-flame" />}
              />
              <StatCard
                label={t("completionRate")}
                value={`${completionRate}%`}
                hint={t("completionHint", { done: stats.trips.completed, cancelled: stats.trips.cancelled })}
                tone="flame"
              />
              <StatCard
                label={t("avgRating")}
                value={stats.reviews.avg_rating ? stats.reviews.avg_rating.toFixed(2) : "—"}
                hint={t("ratingHint", { n: stats.reviews.total })}
                tone="paper"
                icon={<Star weight="fill" className="size-5 text-gold" />}
              />
            </section>

            <section className="mt-3 grid gap-3 sm:grid-cols-2">
              <StatCard
                label={t("compensation")}
                value={formatBaht(Number(stats.trips.compensation_completed), loc)}
                hint={t("compensationHint", { avg: formatBaht(Number(stats.trips.avg_compensation), loc) })}
                tone="paper"
                icon={<Coins weight="fill" className="size-5 text-flame" />}
              />
              <StatCard
                label={t("suspended")}
                value={stats.users.suspended}
                hint={t("adminsHint", { n: stats.users.admins })}
                tone="paper"
              />
            </section>

            <div className="mt-8 grid items-start gap-6 lg:grid-cols-[1.3fr_1fr]">
              <section className="rounded-[28px] bg-paper p-5 shadow-[var(--shadowRaise)]">
                <h2 className="font-display text-xl">{t("weekly")}</h2>
                <p className="mb-4 text-sm text-ink-soft">{t("weeklyHint")}</p>
                <WeeklyBars
                  data={stats.weekly.map((row) => ({
                    label: weekFormat.format(new Date(`${row.week_start}T00:00:00Z`)),
                    created: Number(row.created),
                    completed: Number(row.completed),
                  }))}
                  labels={{ created: t("created"), completed: t("completed") }}
                />
              </section>

              <div className="grid gap-6">
                <section className="rounded-[28px] bg-paper p-5 shadow-[var(--shadowRaise)]">
                  <h2 className="mb-4 font-display text-xl">{t("byCategory")}</h2>
                  <BreakdownBars
                    rows={stats.categories.map((row) => ({ label: tc(row.category), value: Number(row.total) }))}
                  />
                </section>
                <section className="rounded-[28px] bg-paper p-5 shadow-[var(--shadowRaise)]">
                  <h2 className="mb-4 font-display text-xl">{t("byProvince")}</h2>
                  <BreakdownBars
                    rows={stats.provinces.map((row) => ({ label: provinceName(row.province, loc), value: Number(row.total) }))}
                  />
                </section>
              </div>
            </div>
          </>
        ) : null}

        <section className="mt-10">
          <h2 className="font-display text-2xl">{t("pending")}</h2>
          <p className="mb-4 text-sm text-ink-soft">{t("pendingHint")}</p>
          {pending.length === 0 ? (
            <EmptyState title={t("emptyPending")} />
          ) : (
            <ul className="grid gap-3">
              {pending.map((item) => (
                <li key={item.id} className="rounded-[24px] bg-paper p-4 shadow-[var(--shadowRaise)]">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex min-w-0 items-start gap-3">
                      <Avatar name={item.full_name} src={item.avatar_url} className="size-12 text-sm" />
                      <div className="min-w-0">
                        <p className="font-display text-xl">{item.full_name}</p>
                        <p className="text-sm text-ink-soft">{item.bio}</p>
                        <p className="mt-1 text-sm text-ink-soft">
                          {t("experience", { n: item.experience_years ?? 0 })} ·{" "}
                          {item.service_provinces.map((id) => provinceName(id, loc)).join(", ") || "—"}
                        </p>
                        <div className="mt-2">
                          <StatusPill value={item.verification_status} />
                        </div>
                      </div>
                    </div>
                    <AdminUserActions
                      userId={item.id}
                      role={item.role}
                      verification={item.verification_status}
                      suspended={item.account_status === "suspended"}
                      isSelf={item.id === user.id}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-10">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-2xl">{t("recentActivity")}</h2>
            <Link href="/admin/log" className="text-sm font-semibold text-flame underline-offset-2 hover:underline">
              {t("seeAll")}
            </Link>
          </div>
          <div className="mt-4">
            <AdminActivity rows={log} names={names} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
