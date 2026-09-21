import { getTranslations } from "next-intl/server";
import { ArrowRight, CheckCircle } from "@phosphor-icons/react/dist/ssr";
import { Link } from "@/i18n/navigation";
import type { Trip, UserRole } from "@/lib/types";

type Step = { text: string; href?: string; cta?: string; done?: boolean };

/** Answers "what do I do now?" for this trip, so nobody has to work it out. */
export async function NextStep({
  trip,
  role,
  isCustomer,
  isCompanion,
  pendingOffers,
  hasReviewed,
}: {
  trip: Trip;
  role: UserRole;
  isCustomer: boolean;
  isCompanion: boolean;
  pendingOffers: number;
  hasReviewed?: boolean;
}) {
  const t = await getTranslations("nextStep");
  let step: Step | null = null;

  if (isCustomer) {
    if (trip.status === "open" && pendingOffers > 0) {
      step = { text: t("customerPickOffer", { n: pendingOffers }) };
    } else if (trip.status === "open") {
      step = { text: t("customerWaiting"), href: `/companions?trip=${trip.id}`, cta: t("inviteCta") };
    } else if (trip.status === "matched") {
      step = { text: t("customerMatched"), href: `/trips/${trip.id}/chat`, cta: t("chatCta") };
    } else if (trip.status === "in_progress") {
      step = { text: t("customerLive") };
    } else if (trip.status === "completed" && !hasReviewed) {
      step = { text: t("customerReview") };
    } else if (trip.status === "completed") {
      step = { text: t("allDone"), done: true };
    }
  } else if (isCompanion) {
    if (trip.status === "matched") {
      step = { text: t("companionMatched") };
    } else if (trip.status === "in_progress") {
      step = { text: t("companionLive") };
    } else if (trip.status === "completed" && !hasReviewed) {
      step = { text: t("companionReview") };
    } else if (trip.status === "completed") {
      step = { text: t("allDone"), done: true };
    }
  } else if (role === "companion" && trip.status === "open") {
    step = { text: t("companionApply") };
  }

  if (!step) return null;

  return (
    <p
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 rounded-2xl px-4 py-3 text-sm font-semibold ${
        step.done ? "bg-ok/10 text-ok" : "bg-gold/25 text-ink"
      }`}
    >
      {step.done ? <CheckCircle weight="fill" className="size-5 shrink-0" aria-hidden /> : null}
      <span>
        {step.done ? "" : `${t("label")}: `}
        {step.text}
      </span>
      {step.href && step.cta ? (
        <Link href={step.href} className="ml-auto flex items-center gap-1 text-flame underline-offset-2 hover:underline">
          {step.cta}
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      ) : null}
    </p>
  );
}
