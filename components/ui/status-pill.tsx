import { useTranslations } from "next-intl";
import type { TripStatus, VerificationStatus, OfferStatus, AccountStatus } from "@/lib/types";

const tones: Record<string, string> = {
  open: "bg-gold text-ink",
  matched: "bg-ink text-paper",
  in_progress: "bg-flame text-paper",
  completed: "bg-ok text-paper",
  cancelled: "bg-mist text-ink-soft",
  pending: "bg-gold text-ink",
  accepted: "bg-ok text-paper",
  declined: "bg-mist text-ink-soft",
  withdrawn: "bg-mist text-ink-soft",
  approved: "bg-ok text-paper",
  rejected: "bg-danger text-paper",
  not_required: "bg-mist text-ink-soft",
  active: "bg-ok text-paper",
  suspended: "bg-danger text-paper",
};

export function StatusPill({
  value,
}: {
  value: TripStatus | VerificationStatus | OfferStatus | AccountStatus | string;
}) {
  const t = useTranslations("status");
  let label = value;
  try {
    label = t(value);
  } catch {
    label = value;
  }
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-[13px] font-bold uppercase tracking-wider ${tones[value] ?? "bg-mist text-ink"}`}
    >
      {label}
    </span>
  );
}
