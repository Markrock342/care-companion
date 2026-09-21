import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { SiteFooter, SiteHeader } from "@/components/layout/site-header";
import { StatusPill } from "@/components/ui/status-pill";
import { AdminUserActions } from "@/components/admin/user-actions";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";

export default async function AdminUsersPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const { profile } = await requireProfile();
  if (profile.role !== "admin") redirect({ href: "/login", locale });

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });
  const users = (data ?? []) as Profile[];

  return (
    <>
      <SiteHeader variant="app" />
      <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-10">
        <h1 className="font-display text-4xl">{t("admin.users")}</h1>
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-sm uppercase tracking-[0.12em] text-ink-soft">
                <th className="py-3">Name</th>
                <th>Role</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {users.map((item) => (
                <tr key={item.id} className="border-t border-line/80">
                  <td className="py-4 font-semibold">{item.full_name || item.id.slice(0, 8)}</td>
                  <td>{t(`role.${item.role}`)}</td>
                  <td>
                    <div className="flex flex-wrap gap-2">
                      <StatusPill value={item.account_status} />
                      {item.role === "companion" ? (
                        <StatusPill value={item.verification_status} />
                      ) : null}
                    </div>
                  </td>
                  <td className="py-4">
                    <AdminUserActions
                      userId={item.id}
                      suspended={item.account_status === "suspended"}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
