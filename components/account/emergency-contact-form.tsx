"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { saveEmergencyContact } from "@/lib/actions/safety";
import type { EmergencyContact } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

export function EmergencyContactForm({ initial }: { initial: EmergencyContact | null }) {
  const t = useTranslations("safety");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  return (
    <form
      className="grid gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setSaving(true);
        setMessage(null);
        const result = await saveEmergencyContact({
          name: String(form.get("name") ?? ""),
          relation: String(form.get("relation") ?? ""),
          phone: String(form.get("phone") ?? ""),
        });
        setSaving(false);
        if ("error" in result) {
          setMessage({ tone: "error", text: result.error === "invalid_phone" ? t("invalidPhone") : t("saveFailed") });
        } else {
          setMessage({ tone: "ok", text: t("saved") });
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("contactName")}>
          <Input name="name" defaultValue={initial?.name ?? ""} placeholder={t("contactNamePh")} maxLength={80} />
        </Field>
        <Field label={t("contactRelation")}>
          <Input name="relation" defaultValue={initial?.relation ?? ""} placeholder={t("contactRelationPh")} maxLength={40} />
        </Field>
      </div>
      <Field label={t("contactPhone")} hint={t("contactHint")} required>
        <Input name="phone" type="tel" inputMode="tel" required defaultValue={initial?.phone ?? ""} placeholder="0812345678" />
      </Field>
      {message ? (
        <p role={message.tone === "error" ? "alert" : "status"} className={`text-sm ${message.tone === "error" ? "text-danger" : "text-ok"}`}>
          {message.text}
        </p>
      ) : null}
      <Button type="submit" variant="secondary" loading={saving} className="justify-self-start">
        {t("saveContact")}
      </Button>
    </form>
  );
}
