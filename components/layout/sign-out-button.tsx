"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

export function SignOutButton({ variant = "ghost" }: { variant?: "ghost" | "secondary" }) {
  const t = useTranslations("common");
  const router = useRouter();

  return (
    <Button
      variant={variant}
      size="sm"
      onClick={async () => {
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push("/");
        router.refresh();
      }}
    >
      {t("signOut")}
    </Button>
  );
}
