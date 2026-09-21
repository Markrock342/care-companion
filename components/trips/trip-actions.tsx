"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import {
  acceptOffer,
  applyToTrip,
  cancelTrip,
  completeTrip,
  declineOffer,
  startTrip,
  submitReview,
} from "@/lib/actions/trips";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/field";
import type { TripStatus } from "@/lib/types";

export function ApplyForm({ tripId, conflictWarning }: { tripId: string; conflictWarning?: string }) {
  const t = useTranslations("trip");
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        if (conflictWarning && !window.confirm(`${conflictWarning}\n\n${t("confirmConflict")}`)) return;
        setLoading(true);
        await applyToTrip(tripId, message);
        setLoading(false);
        router.refresh();
      }}
    >
      {conflictWarning ? (
        <p role="alert" className="rounded-xl bg-danger/10 px-3 py-2 text-sm font-semibold text-danger">
          ⚠ {conflictWarning}
        </p>
      ) : null}
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={t("applyMsg")}
      />
      <Button type="submit" loading={loading}>
        {t("apply")}
      </Button>
    </form>
  );
}

export function OfferButtons({
  offerId,
  canAccept,
  conflictWarning,
}: {
  offerId: string;
  canAccept: boolean;
  /** Shown in a confirm dialog before accepting a job that clashes with the companion's schedule. */
  conflictWarning?: string;
}) {
  const t = useTranslations("trip");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  return (
    <div className="flex gap-2">
      {canAccept ? (
        <Button
          size="sm"
          loading={loading === "a"}
          onClick={async () => {
            if (conflictWarning && !window.confirm(`${conflictWarning}\n\n${t("confirmConflict")}`)) return;
            setLoading("a");
            await acceptOffer(offerId);
            setLoading(null);
            router.refresh();
          }}
        >
          {t("accept")}
        </Button>
      ) : null}
      <Button
        size="sm"
        variant="ghost"
        loading={loading === "d"}
        onClick={async () => {
          setLoading("d");
          await declineOffer(offerId);
          setLoading(null);
          router.refresh();
        }}
      >
        {t("decline")}
      </Button>
    </div>
  );
}

export function LifecycleButtons({
  tripId,
  status,
  isCustomer,
  isCompanion,
}: {
  tripId: string;
  status: TripStatus;
  isCustomer: boolean;
  isCompanion: boolean;
}) {
  const t = useTranslations("trip");
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function run(key: string, fn: () => Promise<unknown>) {
    setLoading(key);
    await fn();
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      {isCompanion && status === "matched" ? (
        <Button loading={loading === "s"} onClick={() => run("s", () => startTrip(tripId))}>
          {t("start")}
        </Button>
      ) : null}
      {(isCustomer || isCompanion) && (status === "matched" || status === "in_progress") ? (
        <Button
          variant="secondary"
          loading={loading === "c"}
          onClick={() => run("c", () => completeTrip(tripId))}
        >
          {t("complete")}
        </Button>
      ) : null}
      {isCustomer && status !== "completed" && status !== "cancelled" ? (
        <Button
          variant="danger"
          loading={loading === "x"}
          onClick={() => run("x", () => cancelTrip(tripId))}
        >
          {t("cancel")}
        </Button>
      ) : null}
    </div>
  );
}

export function ReviewForm({
  tripId,
  revieweeId,
}: {
  tripId: string;
  revieweeId: string;
}) {
  const t = useTranslations("review");
  const router = useRouter();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  return (
    <form
      className="grid gap-3 rounded-[24px] bg-mist p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setLoading(true);
        await submitReview({ tripId, revieweeId, rating, comment });
        setLoading(false);
        router.refresh();
      }}
    >
      <p className="font-display text-xl">{t("title")}</p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setRating(value)}
            className={`size-11 rounded-full font-display cursor-pointer ${
              value <= rating ? "bg-gold text-ink" : "bg-paper text-ink-soft"
            }`}
          >
            {value}
          </button>
        ))}
      </div>
      <Textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder={t("comment")}
      />
      <Button type="submit" loading={loading}>
        {t("submit")}
      </Button>
    </form>
  );
}
