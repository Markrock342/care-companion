"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { updateCompanionProfile } from "@/lib/actions/profile";
import { SKILL_OPTIONS, WEEKDAYS } from "@/lib/constants";
import { PROVINCES } from "@/lib/provinces";
import type { Profile, Weekday } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";

export function CompanionProfileForm({ profile }: { profile: Profile }) {
  const t = useTranslations("onboarding");
  const tw = useTranslations("weekday");
  const ts = useTranslations("skill");
  const locale = useLocale();
  const [days, setDays] = useState<Weekday[]>(profile.available_days ?? []);
  const [skills, setSkills] = useState<string[]>(profile.skills ?? []);
  const [provinces, setProvinces] = useState<string[]>(profile.service_provinces ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function toggle<T extends string>(list: T[], value: T, set: (next: T[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setSaving(true);
        setError(null);
        setSaved(false);
        const form = new FormData(event.currentTarget);
        const result = await updateCompanionProfile({
          full_name: String(form.get("full_name") ?? ""),
          phone: String(form.get("phone") ?? ""),
          bio: String(form.get("bio") ?? ""),
          skills,
          service_provinces: provinces,
          available_days: days,
          available_from: String(form.get("available_from") ?? ""),
          available_to: String(form.get("available_to") ?? ""),
          experience_years: Number(form.get("experience_years") || 0),
          min_compensation: Number(form.get("min_compensation") || 0),
        });
        setSaving(false);
        if (result && "error" in result && result.error) setError(result.error);
        else setSaved(true);
      }}
    >
      <Field label={t("name")} required>
        <Input name="full_name" defaultValue={profile.full_name} required />
      </Field>
      <Field label={t("phone")}>
        <Input name="phone" defaultValue={profile.phone ?? ""} />
      </Field>
      <Field label={t("bio")}>
        <Textarea name="bio" defaultValue={profile.bio ?? ""} />
      </Field>
      <Field label={t("provinces")}>
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
            {tw(day)}
          </button>
        ))}
      </div>
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
            {ts(skill)}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("from")}>
          <Input name="available_from" type="time" defaultValue={profile.available_from ?? "08:00"} />
        </Field>
        <Field label={t("to")}>
          <Input name="available_to" type="time" defaultValue={profile.available_to ?? "18:00"} />
        </Field>
        <Field label={t("experience")}>
          <Input
            name="experience_years"
            type="number"
            defaultValue={profile.experience_years ?? 0}
          />
        </Field>
        <Field label={t("minPay")}>
          <Input
            name="min_compensation"
            type="number"
            defaultValue={profile.min_compensation ?? 0}
          />
        </Field>
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-ok">OK</p> : null}
      <Button type="submit" loading={saving}>
        {t("submit")}
      </Button>
    </form>
  );
}
