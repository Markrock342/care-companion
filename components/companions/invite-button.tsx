"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { inviteCompanion } from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";

export function InviteButton({
  tripId,
  companionId,
}: {
  tripId: string;
  companionId: string;
}) {
  const t = useTranslations("companions");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <Button
      loading={loading}
      onClick={async () => {
        setLoading(true);
        await inviteCompanion(tripId, companionId);
        setLoading(false);
        router.push(`/trips/${tripId}`);
        router.refresh();
      }}
    >
      {t("invite")}
    </Button>
  );
}
