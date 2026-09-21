"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { setAccountStatus, setVerification } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminUserActions({
  userId,
  suspended,
}: {
  userId: string;
  suspended?: boolean;
}) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key);
    await fn();
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        loading={loading === "ok"}
        onClick={() => run("ok", () => setVerification(userId, "approved"))}
      >
        {t("approve")}
      </Button>
      <Button
        size="sm"
        variant="secondary"
        loading={loading === "no"}
        onClick={() => run("no", () => setVerification(userId, "rejected"))}
      >
        {t("reject")}
      </Button>
      <Button
        size="sm"
        variant="danger"
        loading={loading === "s"}
        onClick={() =>
          run("s", () =>
            setAccountStatus(userId, suspended ? "active" : "suspended"),
          )
        }
      >
        {suspended ? t("restore") : t("suspend")}
      </Button>
    </div>
  );
}
