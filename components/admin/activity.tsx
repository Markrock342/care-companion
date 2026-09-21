import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { EmptyState } from "@/components/ui/empty-state";
import { formatDateTime } from "@/lib/format";
import type { AdminAction } from "@/lib/types";

const TONE: Record<AdminAction["action"], string> = {
  approve_companion: "bg-ok",
  reject_companion: "bg-danger",
  suspend_user: "bg-danger",
  restore_user: "bg-ok",
  change_role: "bg-ink",
  cancel_trip: "bg-flame",
};

/** Who did what, in one readable line each. */
export async function AdminActivity({ rows, names }: { rows: AdminAction[]; names: Map<string, string> }) {
  const t = await getTranslations("admin");
  const locale = await getLocale();

  if (rows.length === 0) return <EmptyState title={t("emptyLog")} />;

  return (
    <ul className="grid gap-2">
      {rows.map((row) => {
        const who = names.get(row.admin_id) ?? t("anAdmin");
        const target = row.target_user ? (names.get(row.target_user) ?? t("aUser")) : null;
        return (
          <li key={row.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-2xl bg-paper px-4 py-3 shadow-[var(--shadowRaise)]">
            <span className={`size-2 shrink-0 rounded-full ${TONE[row.action]}`} aria-hidden />
            <span className="text-sm">
              <span className="font-semibold">{who}</span>{" "}
              {target ? t(`logLine.${row.action}`, { name: target }) : t(`logLine.${row.action}`, { name: "" })}
              {row.target_trip ? (
                <>
                  {" "}
                  <Link href={`/trips/${row.target_trip}`} className="font-semibold text-flame underline-offset-2 hover:underline">
                    {t("viewTrip")}
                  </Link>
                </>
              ) : null}
            </span>
            {row.note ? <span className="text-sm text-ink-soft">“{row.note}”</span> : null}
            <span className="ml-auto whitespace-nowrap text-xs text-ink-soft">{formatDateTime(row.created_at, locale)}</span>
          </li>
        );
      })}
    </ul>
  );
}
