"use client";

import { useLocale } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import styles from "./language-switcher.module.css";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  return (
    <div className={styles.root} role="radiogroup" aria-label="Language">
      {(["th", "en"] as const).map((value) => {
        const selected = locale === value;
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`${styles.option} ${selected ? styles.selected : ""}`}
            onClick={() => router.replace(pathname, { locale: value })}
          >
            {value === "th" ? "TH" : "EN"}
          </button>
        );
      })}
    </div>
  );
}
