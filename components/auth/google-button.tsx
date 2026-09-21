"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { getSupabaseEnv } from "@/lib/supabase/config";
import { Button } from "@/components/ui/button";

export function GoogleButton() {
  const t = useTranslations("login");
  const locale = useLocale();
  const configured = getSupabaseEnv().configured;
  const [loading, setLoading] = useState(false);

  if (!configured) {
    return (
      <p role="status" className="rounded-2xl bg-mist px-4 py-3 text-ink-soft">
        {t("missing")}
      </p>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full"
      loading={loading}
      onClick={async () => {
        setLoading(true);
        const supabase = createClient();
        const origin = window.location.origin;
        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo: `${origin}/${locale}/auth/callback`,
          },
        });
        if (error) setLoading(false);
      }}
    >
      {t("button")}
    </Button>
  );
}
