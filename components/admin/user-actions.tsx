"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setAccountStatus, setUserRole, setVerification } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import type { UserRole } from "@/lib/types";

export function AdminUserActions({
  userId,
  role,
  verification,
  suspended,
  isSelf,
}: {
  userId: string;
  role: UserRole;
  verification?: string;
  suspended?: boolean;
  isSelf?: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState("");

  async function run(key: string, fn: () => Promise<{ error?: string } | { ok: true }>) {
    setLoading(key);
    setError(null);
    const result = await fn();
    setLoading(null);
    if ("error" in result && result.error) {
      setError(result.error.includes("cannot_target_self") ? t("errorSelf") : t("errorGeneric"));
      return;
    }
    setRejecting(false);
    setNote("");
    router.refresh();
  }

  if (isSelf) return <p className="text-sm text-ink-soft">{t("thisIsYou")}</p>;

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        {role === "companion" && verification !== "approved" ? (
          <Button size="sm" loading={loading === "ok"} onClick={() => run("ok", () => setVerification(userId, "approved"))}>
            {t("approve")}
          </Button>
        ) : null}
        {role === "companion" && verification !== "rejected" ? (
          <Button size="sm" variant="ghost" onClick={() => setRejecting((value) => !value)}>
            {t("reject")}
          </Button>
        ) : null}
        <Button
          size="sm"
          variant={suspended ? "secondary" : "danger"}
          loading={loading === "s"}
          onClick={() => {
            if (!suspended && !window.confirm(t("confirmSuspend"))) return;
            void run("s", () => setAccountStatus(userId, suspended ? "active" : "suspended"));
          }}
        >
          {suspended ? t("restore") : t("suspend")}
        </Button>
      </div>

      {rejecting ? (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t("rejectReason")}
            className="h-10 max-w-64"
            maxLength={200}
          />
          <Button size="sm" variant="danger" loading={loading === "no"} onClick={() => run("no", () => setVerification(userId, "rejected", note))}>
            {t("confirmReject")}
          </Button>
        </div>
      ) : null}

      <label className="flex items-center gap-2 text-sm text-ink-soft">
        {t("roleLabel")}
        <select
          value={role}
          disabled={loading === "r"}
          onChange={(event) => {
            const next = event.target.value as UserRole;
            if (!window.confirm(t("confirmRole", { role: t(`roleName.${next}`) }))) {
              event.target.value = role;
              return;
            }
            void run("r", () => setUserRole(userId, next));
          }}
          className="h-9 cursor-pointer rounded-full bg-paper px-3 text-sm font-semibold text-ink ring-1 ring-line"
        >
          <option value="customer">{t("roleName.customer")}</option>
          <option value="companion">{t("roleName.companion")}</option>
          <option value="admin">{t("roleName.admin")}</option>
        </select>
      </label>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
