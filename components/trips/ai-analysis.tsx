"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { analyzeTrip, type TripAnalysis } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

export function AiTripAnalysis({ tripId }: { tripId: string }) {
  const t = useTranslations("ai");
  const locale = useLocale();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TripAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setLoading(true);
    setError(null);
    const response = await analyzeTrip(tripId, locale);
    setLoading(false);
    if ("error" in response) {
      setError(response.error === "not_configured" ? t("notConfigured") : t("failed"));
      return;
    }
    setResult(response.data);
  }

  return (
    <section className="rounded-[28px] border border-ink/10 bg-paper p-5" aria-live="polite">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.16em] text-flame">Gemini</p>
          <h2 className="font-display text-xl">{t("title")}</h2>
        </div>
        <Button size="sm" variant={result ? "ghost" : "primary"} loading={loading} onClick={() => void run()}>
          {loading ? t("loading") : result ? t("again") : t("run")}
        </Button>
      </div>

      {!result && !error ? <p className="mt-2 text-sm text-ink-soft">{t("intro")}</p> : null}
      {error ? (
        <p role="alert" className="mt-3 text-sm text-flame">
          {error}
        </p>
      ) : null}

      {result ? (
        <div className="mt-4 grid gap-4 text-sm">
          <p>{result.summary}</p>
          <List title={t("checklist")} items={result.checklist} />
          <div>
            <h3 className="font-semibold">{t("compensation")}</h3>
            <p className="mt-1">
              <span className="mr-2 rounded-full bg-mist px-2 py-0.5 text-xs font-bold">
                {t(`verdict.${result.compensation.verdict}`)}
              </span>
              {result.compensation.note}
            </p>
          </div>
          <List title={t("tips")} items={result.tips} />
          <List title={t("questions")} items={result.questions} />
          <p className="text-xs text-ink-soft">{t("disclaimer")}</p>
        </div>
      ) : null}
    </section>
  );
}

function List({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <div>
      <h3 className="font-semibold">{title}</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
