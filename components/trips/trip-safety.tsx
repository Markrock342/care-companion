"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Copy, LinkBreak, MapPin, Phone, ShareNetwork, ShieldCheck, Siren } from "@phosphor-icons/react";
import { Link, useRouter } from "@/i18n/navigation";
import { setTripShare, updateTripLocation } from "@/lib/actions/safety";
import { formatDateTime } from "@/lib/format";
import type { EmergencyContact, TripStatus } from "@/lib/types";
import { Button } from "@/components/ui/button";

const AUTO_EVERY_MS = 60_000;

function CallLink({ href, label, sub, tone = "plain" }: { href: string; label: string; sub?: string; tone?: "plain" | "danger" }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ring-1 transition-colors ${
        tone === "danger" ? "bg-danger text-paper ring-danger hover:brightness-110" : "bg-paper ring-line hover:ring-flame"
      }`}
    >
      <Phone weight="fill" className="size-5 shrink-0" aria-hidden />
      <span className="min-w-0">
        <span className="block font-semibold leading-tight">{label}</span>
        {sub ? <span className={`block truncate text-xs ${tone === "danger" ? "text-paper/80" : "text-ink-soft"}`}>{sub}</span> : null}
      </span>
    </a>
  );
}

export function TripSafety({
  tripId,
  status,
  isCustomer,
  shareToken,
  lastLocatedAt,
  emergency,
  otherParty,
}: {
  tripId: string;
  status: TripStatus;
  isCustomer: boolean;
  shareToken: string | null;
  lastLocatedAt: string | null;
  emergency: EmergencyContact | null;
  otherParty: { label: string; name: string; phone: string | null } | null;
}) {
  const t = useTranslations("safety");
  const locale = useLocale();
  const router = useRouter();
  const [token, setToken] = useState(shareToken);
  const [busy, setBusy] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [locatedAt, setLocatedAt] = useState(lastLocatedAt);
  const [auto, setAuto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);
  const live = status === "in_progress";
  const shareUrl = token && typeof window !== "undefined" ? `${window.location.origin}/${locale}/share/${token}` : null;

  const sendLocation = useCallback(
    () =>
      new Promise<void>((resolve) => {
        if (!("geolocation" in navigator)) {
          setError(t("noGeo"));
          return resolve();
        }
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const result = await updateTripLocation(tripId, position.coords.latitude, position.coords.longitude);
            if ("error" in result) setError(t("locationFailed"));
            else {
              setError(null);
              setLocatedAt(result.at);
            }
            resolve();
          },
          () => {
            setError(t("geoDenied"));
            setAuto(false);
            resolve();
          },
          { enableHighAccuracy: true, timeout: 15_000, maximumAge: 30_000 },
        );
      }),
    [t, tripId],
  );

  useEffect(() => {
    if (!auto || !live) return;
    timer.current = window.setInterval(() => void sendLocation(), AUTO_EVERY_MS);
    return () => {
      if (timer.current) window.clearInterval(timer.current);
    };
  }, [auto, live, sendLocation]);

  async function toggleShare(enabled: boolean) {
    setBusy(enabled ? "share" : "revoke");
    const result = await setTripShare(tripId, enabled);
    setBusy(null);
    if ("error" in result) return setError(t("shareFailed"));
    setToken(result.token);
    router.refresh();
  }

  async function shareLink() {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: t("shareTitle"), text: t("shareText"), url: shareUrl });
        return;
      } catch {
        /* cancelled: fall back to copy */
      }
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  }

  return (
    <section className="grid gap-4 rounded-[28px] bg-mist p-5" aria-labelledby="safety-title">
      <div className="flex items-center gap-2">
        <ShieldCheck weight="fill" className="size-6 text-flame" aria-hidden />
        <h2 id="safety-title" className="font-display text-xl">
          {t("title")}
        </h2>
      </div>

      {/* Emergency calls */}
      <div className="grid gap-2">
        <p className="flex items-center gap-1.5 text-sm font-bold text-danger">
          <Siren weight="fill" className="size-4" aria-hidden />
          {t("emergency")}
        </p>
        {emergency ? (
          <CallLink
            href={`tel:${emergency.phone}`}
            tone="danger"
            label={t("callContact", { name: emergency.name || emergency.phone })}
            sub={[emergency.relation, emergency.phone].filter(Boolean).join(" · ")}
          />
        ) : (
          <p className="rounded-2xl bg-paper px-4 py-3 text-sm text-ink-soft">
            {isCustomer ? (
              <>
                {t("noContactCustomer")}{" "}
                <Link href="/account" className="font-semibold text-flame underline-offset-2 hover:underline">
                  {t("setContact")}
                </Link>
              </>
            ) : (
              t("noContactCompanion")
            )}
          </p>
        )}
        <div className="grid gap-2 sm:grid-cols-2">
          <CallLink href="tel:1669" label={t("call1669")} sub={t("call1669Sub")} />
          {otherParty?.phone ? (
            <CallLink href={`tel:${otherParty.phone}`} label={t("callOther", { role: otherParty.label })} sub={otherParty.name} />
          ) : (
            <CallLink href="tel:191" label={t("call191")} sub={t("call191Sub")} />
          )}
        </div>
      </div>

      {/* Family link */}
      {isCustomer ? (
        <div className="grid gap-2 border-t border-line pt-4">
          <p className="text-sm font-bold">{t("familyTitle")}</p>
          <p className="text-sm text-ink-soft">{t("familyIntro")}</p>
          {token && shareUrl ? (
            <>
              <p className="truncate rounded-xl bg-paper px-3 py-2 font-mono text-xs text-ink-soft ring-1 ring-line">{shareUrl}</p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => void shareLink()}>
                  {copied ? <Copy className="size-4" aria-hidden /> : <ShareNetwork className="size-4" aria-hidden />}
                  {copied ? t("copied") : t("sendLink")}
                </Button>
                <Button size="sm" variant="ghost" loading={busy === "revoke"} onClick={() => void toggleShare(false)}>
                  <LinkBreak className="size-4" aria-hidden />
                  {t("revoke")}
                </Button>
              </div>
            </>
          ) : (
            <Button size="sm" variant="secondary" loading={busy === "share"} onClick={() => void toggleShare(true)} className="justify-self-start">
              <ShareNetwork className="size-4" aria-hidden />
              {t("createLink")}
            </Button>
          )}
        </div>
      ) : null}

      {/* Live location */}
      <div className="grid gap-2 border-t border-line pt-4">
        <p className="flex items-center gap-1.5 text-sm font-bold">
          <MapPin weight="fill" className="size-4 text-[#2563eb]" aria-hidden />
          {t("locationTitle")}
        </p>
        {live ? (
          <>
            <p className="text-sm text-ink-soft">
              {locatedAt ? t("lastSent", { time: formatDateTime(locatedAt, locale) }) : t("notSent")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button
                size="sm"
                variant="ghost"
                loading={busy === "locate"}
                onClick={async () => {
                  setBusy("locate");
                  await sendLocation();
                  setBusy(null);
                }}
              >
                {t("sendNow")}
              </Button>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={auto}
                  onChange={(event) => {
                    setAuto(event.target.checked);
                    if (event.target.checked) void sendLocation();
                  }}
                  className="size-4 accent-[var(--colorFlame)]"
                />
                {t("autoEveryMinute")}
              </label>
            </div>
          </>
        ) : (
          <p className="text-sm text-ink-soft">{t("locationAfterStart")}</p>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </section>
  );
}
