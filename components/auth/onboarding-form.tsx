"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { createProfile } from "@/lib/actions/profile";
import { SKILL_OPTIONS, WEEKDAYS } from "@/lib/constants";
import { PROVINCES } from "@/lib/provinces";
import type { UserRole, Weekday } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { dashboardPath } from "@/lib/paths";

export function OnboardingForm({
  defaultName,
}: {
  defaultName: string;
}) {
  const t = useTranslations();
  const locale = useLocale() as "th" | "en";
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("customer");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<Weekday[]>([...WEEKDAYS]);
  const [skills, setSkills] = useState<string[]>(["walking"]);
  const [provinces, setProvinces] = useState<string[]>(["bangkok"]);

  function toggle<T extends string>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <form
      className="grid gap-6"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        const form = new FormData(event.currentTarget);
        const result = await createProfile({
          role,
          full_name: String(form.get("full_name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          bio: String(form.get("bio") ?? ""),
          locale,
          skills: role === "companion" ? skills : [],
          service_provinces: role === "companion" ? provinces : [],
          available_days: role === "companion" ? days : [],
          available_from: String(form.get("available_from") ?? "") || undefined,
          available_to: String(form.get("available_to") ?? "") || undefined,
          experience_years:
            role === "companion" ? Number(form.get("experience_years") || 0) : null,
          min_compensation:
            role === "companion" ? Number(form.get("min_compensation") || 0) : null,
        });
        setSaving(false);
        if ("error" in result && result.error) {
          setError(result.error);
          return;
        }
        if ("role" in result && result.role) {
          router.push(dashboardPath(result.role as "customer" | "companion"));
          router.refresh();
        }
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        {(["customer", "companion"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRole(value)}
            className={`rounded-[24px] p-5 text-left cursor-pointer ${
              role === value ? "bg-ink text-paper" : "bg-mist text-ink"
            }`}
          >
            <p className="font-display text-xl">
              {t(`onboarding.${value === "customer" ? "asCustomer" : "asCompanion"}`)}
            </p>
            <p className={`mt-2 text-sm ${role === value ? "text-paper/80" : "text-ink-soft"}`}>
              {t(`onboarding.${value === "customer" ? "asCustomerHint" : "asCompanionHint"}`)}
            </p>
          </button>
        ))}
      </div>

      <Field label={t("onboarding.name")} required>
        <Input name="full_name" required defaultValue={defaultName} />
      </Field>
      <Field label={t("onboarding.phone")}>
        <Input name="phone" type="tel" inputMode="tel" />
      </Field>
      <Field label={t("onboarding.bio")}>
        <Textarea name="bio" />
      </Field>

      {role === "companion" ? (
        <>
          <Field label={t("onboarding.provinces")} required>
            <Select
              multiple
              value={provinces}
              onChange={(event) =>
                setProvinces(Array.from(event.target.selectedOptions).map((o) => o.value))
              }

            >
              {PROVINCES.map((province) => (
                <option key={province.id} value={province.id}>
                  {locale === "en" ? province.en : province.th}
                </option>
              ))}
            </Select>
          </Field>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("onboarding.days")}</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggle(days, day, setDays)}
                  className={`rounded-full px-3 py-2 text-sm font-bold cursor-pointer ${
                    days.includes(day) ? "bg-flame text-paper" : "bg-mist"
                  }`}
                >
                  {t(`weekday.${day}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-semibold">{t("onboarding.skills")}</legend>
            <div className="flex flex-wrap gap-2">
              {SKILL_OPTIONS.map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => toggle(skills, skill, setSkills)}
                  className={`rounded-full px-3 py-2 text-sm font-bold cursor-pointer ${
                    skills.includes(skill) ? "bg-ink text-paper" : "bg-mist"
                  }`}
                >
                  {t(`skill.${skill}`)}
                </button>
              ))}
            </div>
          </fieldset>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label={t("onboarding.from")}>
              <Input name="available_from" type="time" defaultValue="08:00" />
            </Field>
            <Field label={t("onboarding.to")}>
              <Input name="available_to" type="time" defaultValue="18:00" />
            </Field>
            <Field label={t("onboarding.experience")}>
              <Input name="experience_years" type="number" min={0} defaultValue={1} />
            </Field>
            <Field label={t("onboarding.minPay")}>
              <Input name="min_compensation" type="number" min={0} defaultValue={300} />
            </Field>
          </div>
        </>
      ) : null}

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <Button type="submit" size="lg" loading={saving}>
        {saving ? t("onboarding.saving") : t("onboarding.submit")}
      </Button>
    </form>
  );
}
