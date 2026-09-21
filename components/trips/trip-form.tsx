"use client";

import { useMemo, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createTrip } from "@/lib/actions/trips";
import { CATEGORIES } from "@/lib/constants";
import { PROVINCES } from "@/lib/provinces";
import type { TripCategory } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { TripMap } from "@/components/map/trip-map-loader";
import { AiQuickFill } from "@/components/trips/ai-quick-fill";
import type { TripDraft } from "@/lib/actions/ai";

type Pin = { lat: number; lng: number } | null;

export function TripForm({
  inviteCompanionId,
}: {
  inviteCompanionId?: string;
}) {
  const t = useTranslations("tripForm");
  const tc = useTranslations("category");
  const locale = useLocale();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [origin, setOrigin] = useState<Pin>(null);
  const [destination, setDestination] = useState<Pin>(null);
  const [pinTarget, setPinTarget] = useState<"origin" | "destination">(
    "origin",
  );
  const formRef = useRef<HTMLFormElement>(null);

  /** Writes the AI draft into the (uncontrolled) inputs and returns the labels it filled. */
  function applyDraft(draft: TripDraft) {
    const form = formRef.current;
    if (!form) return [];
    const filled: string[] = [];
    const set = (
      name: string,
      value: string | number | null,
      label: string,
    ) => {
      const field = form.elements.namedItem(name) as
        HTMLInputElement | HTMLSelectElement | null;
      if (!field || value === null || value === "") return;
      field.value = String(value);
      filled.push(label);
    };

    set("category", draft.category, t("category"));
    set("title", draft.title, t("name"));
    set("details", draft.details, t("details"));
    set("origin_label", draft.origin_label, t("origin"));
    set(
      "origin_province",
      draft.origin_province,
      `${t("province")} (${t("origin")})`,
    );
    set("destination_label", draft.destination_label, t("destination"));
    set(
      "destination_province",
      draft.destination_province,
      `${t("province")} (${t("destination")})`,
    );
    set("scheduled_date", draft.scheduled_date, t("date"));
    set("start_time", draft.start_time, t("time"));
    set("duration_hours", draft.duration_hours, t("duration"));
    set("offered_compensation", draft.offered_compensation, t("pay"));

    if (draft.origin_lat !== null && draft.origin_lng !== null) {
      setOrigin({ lat: draft.origin_lat, lng: draft.origin_lng });
    }
    if (draft.destination_lat !== null && draft.destination_lng !== null) {
      setDestination({
        lat: draft.destination_lat,
        lng: draft.destination_lng,
      });
      filled.push(t("mapPin"));
    }
    return filled;
  }

  const tomorrow = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    return date.toISOString().slice(0, 10);
  }, []);

  return (
    <div className="grid gap-6">
      <AiQuickFill onDraft={applyDraft} />
      <form
        ref={formRef}
        className="grid gap-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setSaving(true);
          setError(null);
          const form = new FormData(event.currentTarget);
          const result = await createTrip({
            category: String(form.get("category")) as TripCategory,
            title: String(form.get("title") ?? ""),
            details: String(form.get("details") ?? ""),
            origin_label: String(form.get("origin_label") ?? ""),
            origin_lat: origin?.lat ?? null,
            origin_lng: origin?.lng ?? null,
            origin_province: String(form.get("origin_province") ?? ""),
            destination_label: String(form.get("destination_label") ?? ""),
            destination_lat: destination?.lat ?? null,
            destination_lng: destination?.lng ?? null,
            destination_province: String(
              form.get("destination_province") ?? "",
            ),
            scheduled_date: String(form.get("scheduled_date") ?? ""),
            start_time: String(form.get("start_time") ?? ""),
            duration_hours: Number(form.get("duration_hours") || 2),
            offered_compensation: Number(form.get("offered_compensation") || 0),
            inviteCompanionId,
          });
          setSaving(false);
          if ("error" in result && result.error) {
            setError(result.error);
            return;
          }
          if ("id" in result) {
            router.push(`/trips/${result.id}`);
            router.refresh();
          }
        }}
      >
        <Field label={t("category")} required>
          <Select name="category" defaultValue="hospital">
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {tc(category)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label={t("name")} required>
          <Input name="title" required placeholder={t("namePh")} />
        </Field>
        <Field label={t("details")}>
          <Textarea name="details" placeholder={t("detailsPh")} />
        </Field>

        <div className="grid gap-4 md:grid-cols-2">
          <Field label={t("origin")} required>
            <Input name="origin_label" required placeholder={t("addressPh")} />
          </Field>
          <Field label={t("province")} required>
            <Select name="origin_province" defaultValue="bangkok">
              {PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {locale === "en" ? province.en : province.th}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("destination")} required>
            <Input
              name="destination_label"
              required
              placeholder={t("addressPh")}
            />
          </Field>
          <Field label={t("province")} required>
            <Select name="destination_province" defaultValue="bangkok">
              {PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {locale === "en" ? province.en : province.th}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <div>
          <div className="mb-2 flex gap-2">
            {(["origin", "destination"] as const).map((target) => (
              <button
                key={target}
                type="button"
                onClick={() => setPinTarget(target)}
                className={`rounded-full px-3 py-1.5 text-sm font-bold cursor-pointer ${
                  pinTarget === target ? "bg-ink text-paper" : "bg-mist"
                }`}
              >
                {target === "origin" ? "A" : "B"} · {t(target)}
              </button>
            ))}
          </div>
          <p className="mb-2 text-sm text-ink-soft">{t("mapHint")}</p>
          <TripMap
            origin={origin}
            destination={destination}
            onMapClick={(lat, lng) => {
              if (pinTarget === "origin") setOrigin({ lat, lng });
              else setDestination({ lat, lng });
            }}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label={t("date")} required>
            <Input
              name="scheduled_date"
              type="date"
              required
              defaultValue={tomorrow}
            />
          </Field>
          <Field label={t("time")} required>
            <Input
              name="start_time"
              type="time"
              required
              defaultValue="09:00"
            />
          </Field>
          <Field label={t("duration")} required>
            <Input
              name="duration_hours"
              type="number"
              min={1}
              step={0.5}
              defaultValue={2}
            />
          </Field>
        </div>
        <Field label={t("pay")} hint={t("payHint")} required>
          <Input
            name="offered_compensation"
            type="number"
            min={0}
            defaultValue={500}
          />
        </Field>

        {error ? <p className="text-sm text-danger">{error}</p> : null}
        <Button type="submit" size="lg" loading={saving}>
          {inviteCompanionId ? t("invite") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
