import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { redirect, Link } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { StatusPill } from "@/components/ui/status-pill";
import { Avatar } from "@/components/ui/avatar";
import { EmptyState } from "@/components/ui/empty-state";
import { AdminUserActions } from "@/components/admin/user-actions";
import { FilterChips } from "@/components/admin/filter-chips";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { provinceName } from "@/lib/provinces";
import type { Profile, UserRole } from "@/lib/types";

const ROLES: (UserRole | "")[] = ["", "customer", "companion", "admin"];
const STATES = ["", "pending", "approved", "rejected", "suspended"] as const;

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
  let request = supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(200);
  if (role) request = request.eq("role", role);
  if (state === "suspended") request = request.eq("account_status", "suspended");
  else if (state) request = request.eq("verification_status", state);
  if (search) request = request.ilike("full_name", `%${search}%`);

  const { data } = await request;
  const users = (data ?? []) as Profile[];
  const params_ = { role, verification: state, q: search };

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Link href="/admin" className="text-sm font-semibold text-flame">
          ← {t("title")}
        </Link>
        <h1 className="mt-2 font-display text-3xl sm:text-4xl">{t("users")}</h1>
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
            params={params_}
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
            params={params_}
            options={[
              { value: "", label: t("allStates") },
              { value: "pending", label: t("statePending") },
              { value: "approved", label: t("stateApproved") },
              { value: "rejected", label: t("stateRejected") },
              { value: "suspended", label: t("stateSuspended") },
            ]}
          />
        </div>

        <p className="mt-4 text-sm text-ink-soft">{t("found", { n: users.length })}</p>

        {users.length === 0 ? (
          <div className="mt-4">
            <EmptyState title={t("emptyUsers")} />
          </div>
        ) : (
          <ul className="mt-4 grid gap-3">
            {users.map((item) => (
              <li key={item.id} className="rounded-[24px] bg-paper p-4 shadow-[var(--shadowRaise)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <Avatar name={item.full_name || "?"} src={item.avatar_url} className="size-12 text-sm" />
                    <div className="min-w-0">
                      <p className="font-display text-xl">
                        {item.full_name || item.id.slice(0, 8)}
                        {item.id === user.id ? <span className="ml-2 text-sm text-ink-soft">({t("you")})</span> : null}
                      </p>
                      <p className="text-sm text-ink-soft">
                        {tr(item.role)} · {t("joined", { date: formatDate(item.created_at.slice(0, 10), loc) })}
                        {item.phone ? ` · ${item.phone}` : ""}
                      </p>
                      {item.role === "companion" ? (
                        <p className="text-sm text-ink-soft">
                          {item.service_provinces.map((id) => provinceName(id, loc)).join(", ") || t("noArea")}
                        </p>
                      ) : null}
                      {item.verification_note ? (
                        <p className="mt-1 text-sm text-danger">“{item.verification_note}”</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap gap-2">
                        <StatusPill value={item.account_status} />
                        {item.role === "companion" ? <StatusPill value={item.verification_status} /> : null}
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
      </main>
      <SiteFooter />
    </>
  );
}
