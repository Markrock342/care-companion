import type { ReactNode } from "react";

/** One headline number with an optional supporting line. */
export function StatCard({
  label,
  value,
  hint,
  tone = "ink",
  icon,
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "ink" | "flame" | "paper";
  icon?: ReactNode;
}) {
  const skin =
    tone === "flame"
      ? "bg-flame text-paper"
      : tone === "paper"
        ? "bg-paper text-ink shadow-[var(--shadowRaise)]"
        : "bg-ink text-paper";
  return (
    <div className={`rounded-[24px] p-5 ${skin}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`text-xs font-bold uppercase tracking-[0.16em] ${tone === "paper" ? "text-ink-soft" : "opacity-80"}`}>
          {label}
        </p>
        {icon ? <span className="opacity-70">{icon}</span> : null}
      </div>
      <p className="mt-2 font-display text-4xl leading-none">{value}</p>
      {hint ? <p className={`mt-2 text-sm ${tone === "paper" ? "text-ink-soft" : "opacity-80"}`}>{hint}</p> : null}
    </div>
  );
}
