import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, Envelope, MagnifyingGlass, Phone, SignIn, Star } from "@phosphor-icons/react/dist/ssr";
import { redirect, Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminUserActions } from "@/components/admin/user-actions";
import { FilterChips } from "@/components/admin/filter-chips";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { UserRole } from "@/lib/types";

const ROLES: (UserRole | "")[] = ["", "customer", "companion", "admin"];
const STATES = ["", "pending", "approved", "rejected", "suspended"] as const;

/** One row of admin_list_users: profile plus the sign-in data from auth.users. */
type MemberRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  avatar_url: string | null;
  role: UserRole;
  verification_status: string;
  verification_note: string | null;
  account_status: string;
  service_provinces: string[];
  experience_years: number | null;
  bio: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  trips_as_customer: number;
  trips_as_companion: number;
  avg_rating: number | null;
};

export default async function AdminUsersPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ role?: string; verification?: string; q?: string }>;
}) {
  const { locale } = await params;
  const query = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("admin");
  const tr = await getTranslations("role");
  const loc = await getLocale();
  const { user, profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/login", locale });

  const role = ROLES.includes(query.role as UserRole) ? (query.role ?? "") : "";
  const state = (STATES as readonly string[]).includes(query.verification ?? "") ? (query.verification ?? "") : "";
  const search = (query.q ?? "").trim();

  const supabase = await createClient();
  const { data } = await supabase.rpc("admin_list_users", {
    p_role: role || null,
    p_state: state || null,
    p_search: search || null,
    p_limit: 200,
  });
  const members = (data ?? []) as MemberRow[];
  const filters = { role, verification: state, q: search };

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Link href="/admin" className="text-sm font-semibold text-flame">
          ← {t("title")}
        </Link>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t("members")}</h1>
        <p className="mt-1 text-sm text-ink-soft">{t("usersPageHint")}</p>

        <form action="" className="mt-5 flex gap-2">
          {role ? <input type="hidden" name="role" value={role} /> : null}
          {state ? <input type="hidden" name="verification" value={state} /> : null}
          <label className="flex h-12 flex-1 items-center gap-2 rounded-full bg-mist px-4">
            <MagnifyingGlass className="size-5 shrink-0 text-ink-soft" aria-hidden />
            <span className="sr-only">{t("searchUsers")}</span>
            <input
              type="search"
              name="q"
              defaultValue={search}
              placeholder={t("searchUsers")}
              className="w-full bg-transparent outline-none"
            />
          </label>
          <button type="submit" className="h-12 shrink-0 rounded-full bg-ink px-5 font-semibold text-paper">
            {t("search")}
          </button>
        </form>

        <div className="mt-4 grid gap-2">
          <FilterChips
            basePath="/admin/users"
            param="role"
            current={role}
            params={filters}
            options={[
              { value: "", label: t("allRoles") },
              { value: "customer", label: tr("customer") },
              { value: "companion", label: tr("companion") },
              { value: "admin", label: tr("admin") },
            ]}
          />
          <FilterChips
            basePath="/admin/users"
            param="verification"
            current={state}
            params={filters}
            options={[
              { value: "", label: t("allStates") },
              { value: "pending", label: t("statePending") },
              { value: "approved", label: t("stateApproved") },
              { value: "rejected", label: t("stateRejected") },
              { value: "suspended", label: t("stateSuspended") },
            ]}
          />
        </div>

        <p className="mt-4 text-sm text-ink-soft">{t("found", { n: members.length })}</p>

        {members.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t("emptyUsers")} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {members.map((member) => (
              <li key={member.id} className="rounded-[24px] bg-paper p-4 shadow-[var(--shadowRaise)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={member.full_name || "?"} src={member.avatar_url} className="size-12 text-sm" />
                    <div className="min-w-0">
                      <p className="font-display text-xl">
                        {member.full_name || member.email}
                        {member.id === user.id ? <span className="ml-2 text-sm text-ink-soft">({t("you")})</span> : null}
                      </p>

                      <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Envelope className="size-4" aria-hidden />
                          {member.email}
                        </span>
                        {member.phone ? (
                          <span className="flex items-center gap-1">
                            <Phone className="size-4" aria-hidden />
                            {member.phone}
                          </span>
                        ) : null}
                      </p>

                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                        <span>{tr(member.role)}</span>
                        <span>· {t("joined", { date: formatDate(member.created_at.slice(0, 10), loc) })}</span>
                        <span className="flex items-center gap-1">
                          <SignIn className="size-4" aria-hidden />
                          {member.last_sign_in_at ? t("lastSeen", { time: formatDateTime(member.last_sign_in_at, loc) }) : t("neverSignedIn")}
                        </span>
                      </p>

                      <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-soft">
                        <span className="flex items-center gap-1">
                          <Briefcase className="size-4" aria-hidden />
                          {member.role === "companion"
                            ? t("jobsTaken", { n: Number(member.trips_as_companion) })
                            : t("requestsMade", { n: Number(member.trips_as_customer) })}
                        </span>
                        {member.avg_rating ? (
                          <span className="flex items-center gap-1">
                            <Star weight="fill" className="size-4 text-gold" aria-hidden />
                            {Number(member.avg_rating).toFixed(2)}
                          </span>
                        ) : null}
                        {member.role === "companion" && member.service_provinces.length ? (
                          <span>{member.service_provinces.map((id) => provinceName(id, loc)).join(", ")}</span>
                        ) : null}
                      </p>

                      {member.verification_note ? (
                        <p className="mt-1 text-sm text-danger">“{member.verification_note}”</p>
                      ) : null}

                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill value={member.account_status} />
                        {member.role === "companion" ? <StatusPill value={member.verification_status} /> : null}
                      </div>
                    </div>
                  </div>

                  <AdminUserActions
                    userId={member.id}
                    role={member.role}
                    verification={member.verification_status}
                    suspended={member.account_status === "suspended"}
                    isSelf={member.id === user.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
