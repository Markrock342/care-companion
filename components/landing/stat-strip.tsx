"use client";

import { useTranslations } from "next-intl";
import { SlidingNumber } from "@/components/animate-ui/primitives/texts/sliding-number";
import { GlowCard } from "@/components/uiverse/glow-card";

const STATS = [
  { key: "statProvinces", value: 77 },
  { key: "statTypes", value: 6 },
  { key: "statSteps", value: 3 },
] as const;

export function StatStrip() {
  const t = useTranslations("landing");
  return (
    <div className="mx-auto grid max-w-6xl gap-[var(--space-md)] px-[var(--space-md)] py-[var(--space-xl)] sm:grid-cols-3">
      {STATS.map((stat) => (
        <GlowCard
          key={stat.key}
          value={
            <SlidingNumber
              number={stat.value}
              inView
              inViewOnce
              className="font-display"
            />
          }
          label={t(stat.key)}
        />
      ))}
    </div>
  );
}
