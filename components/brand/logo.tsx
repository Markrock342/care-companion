import { Link } from "@/i18n/navigation";
import { useTranslations } from "next-intl";

export function Wordmark({ compact = false }: { compact?: boolean }) {
  const t = useTranslations("brand");
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className="relative grid size-10 place-items-center rounded-2xl bg-flame text-paper shadow-[0_3px_0_var(--colorFlameHot)]"
        aria-hidden
      >
        <svg viewBox="0 0 32 32" className="size-6" fill="none">
          <path
            d="M16 28s-9-6.2-9-13a9 9 0 1 1 18 0c0 6.8-9 13-9 13Z"
            fill="currentColor"
          />
          <circle cx="13.2" cy="13" r="1.3" fill="var(--colorInk)" />
          <circle cx="18.8" cy="13" r="1.3" fill="var(--colorInk)" />
          <path
            d="M11.5 17.2c.6 1.6 2 2.4 4.5 2.4s3.9-.8 4.5-2.4"
            stroke="var(--colorInk)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
        </svg>
      </span>
      {compact ? (
        <span className="sr-only">{t("name")}</span>
      ) : (
        <span className="hidden whitespace-nowrap leading-tight sm:block">
          <span className="block font-display text-lg tracking-tight">{t("name")}</span>
          <span className="block text-xs font-semibold uppercase tracking-[0.18em] text-ink-soft">
            {t("tag")}
          </span>
        </span>
      )}
    </Link>
  );
}

export function RouteRibbon({
  from,
  to,
}: {
  from: string;
  to: string;
}) {
  return (
    <div className="grid gap-[var(--space-sm)] font-display">
      <div className="flex items-center gap-[var(--space-sm)]">
        <span className="grid size-9 place-items-center rounded-full bg-paper text-sm font-bold text-ink">
          A
        </span>
        <span className="text-lg">{from}</span>
      </div>
      <div
        className="route-stem ml-[17px] h-10 w-[2px] bg-[repeating-linear-gradient(180deg,currentColor_0_6px,transparent_6px_12px)]"
        aria-hidden
      />
      <div className="marker-b flex items-center gap-[var(--space-sm)]">
        <span className="grid size-9 place-items-center rounded-full bg-flame text-sm font-bold text-paper">
          B
        </span>
        <span className="text-lg">{to}</span>
      </div>
    </div>
  );
}
