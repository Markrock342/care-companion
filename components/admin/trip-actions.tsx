"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { adminCancelTrip } from "@/lib/actions/admin";
import { Button } from "@/components/ui/button";

export function AdminTripActions({ tripId, canCancel }: { tripId: string; canCancel: boolean }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!canCancel) return null;

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="danger"
        loading={loading}
        onClick={async () => {
          const note = window.prompt(t("cancelReason"));
          if (note === null) return;
          setLoading(true);
          const result = await adminCancelTrip(tripId, note);
          setLoading(false);
          if ("error" in result && result.error) return setError(t("errorGeneric"));
          router.refresh();
        }}
      >
        {t("forceCancel")}
      </Button>
      {error ? (
        <span role="alert" className="text-sm text-danger">
          {error}
        </span>
      ) : null}
    </div>
  );
}
