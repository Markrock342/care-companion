import { Link } from "@/i18n/navigation";
import type { ComponentProps, ReactNode } from "react";
import styles from "./button.module.css";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "plate";
type Size = "md" | "lg" | "sm";

type Common = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
};

function classNames(
  variant: Variant,
  size: Size,
  className = "",
) {
  return [styles.root, styles[variant], styles[size], className]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  children,
  className,
  variant = "primary",
  size = "md",
  loading,
  disabled,
  type = "button",
  ...props
}: Common & ComponentProps<"button">) {
  const isDisabled = Boolean(disabled || loading);
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={classNames(variant, size, className)}
      {...props}
    >
      {loading ? <span className={styles.spinner} aria-hidden /> : null}
      {children}
    </button>
  );
}

export function ButtonLink({
  children,
  className,
  variant = "primary",
  size = "md",
  href,
  ...props
}: Common & Omit<ComponentProps<typeof Link>, "href"> & { href: ComponentProps<typeof Link>["href"] }) {
  return (
    <Link href={href} className={classNames(variant, size, className)} {...props}>
      {children}
    </Link>
  );
}
