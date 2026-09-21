"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Sparkle } from "@phosphor-icons/react";
import { draftTripFromText, type TripDraft } from "@/lib/actions/ai";
import { Button } from "@/components/ui/button";

export function AiQuickFill({ onDraft }: { onDraft: (draft: TripDraft) => string[] }) {
  const t = useTranslations("aiFill");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filled, setFilled] = useState<string[] | null>(null);
  const examples = t.raw("examples") as string[];

  async function run(value = text) {
    if (!value.trim()) return;
    setLoading(true);
    setError(null);
    setFilled(null);
    const result = await draftTripFromText(value);
    setLoading(false);
    if ("error" in result) {
      setError(result.error === "not_configured" ? t("notConfigured") : t("failed"));
      return;
    }
    setFilled(onDraft(result.data));
  }

  return (
    <section className="rounded-[28px] border border-flame/25 bg-flame/5 p-5" aria-live="polite">
      <div className="flex items-center gap-2 text-flame">
        <Sparkle weight="fill" className="size-5" aria-hidden />
        <h2 className="font-display text-xl text-ink">{t("title")}</h2>
      </div>
      <p className="mt-1 text-sm text-ink-soft">{t("intro")}</p>

      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <textarea
          value={text}
          onChange={(event) => setText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void run();
            }
          }}
          rows={2}
          maxLength={500}
          placeholder={t("placeholder")}
          aria-label={t("title")}
          className="min-h-14 flex-1 resize-none rounded-2xl border border-line bg-paper px-4 py-3 text-base outline-none focus:border-flame"
        />
        <Button type="button" loading={loading} disabled={!text.trim()} onClick={() => void run()} className="sm:self-stretch sm:h-auto">
          {loading ? t("loading") : t("run")}
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {examples.map((example) => (
          <button
            key={example}
            type="button"
            disabled={loading}
            onClick={() => {
              setText(example);
              void run(example);
            }}
            className="cursor-pointer rounded-full bg-paper px-3 py-1.5 text-left text-xs text-ink-soft ring-1 ring-line hover:text-flame hover:ring-flame disabled:opacity-50"
          >
            {example}
          </button>
        ))}
      </div>

      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {error}
        </p>
      ) : null}
      {filled ? (
        <p className="mt-3 text-sm">
          {filled.length > 0 ? t("filled", { fields: filled.join(", ") }) : t("nothing")}{" "}
          <span className="text-ink-soft">{t("check")}</span>
        </p>
      ) : null}
    </section>
  );
}
