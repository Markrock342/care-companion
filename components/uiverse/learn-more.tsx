import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";
import styles from "./learn-more.module.css";

export function LearnMoreLink({
  href,
  children,
  ...props
}: { href: ComponentProps<typeof Link>["href"]; children: React.ReactNode } & Omit<
  ComponentProps<typeof Link>,
  "href" | "children"
>) {
  return (
    <Link href={href} className={styles.root} {...props}>
      <span className={styles.circle} aria-hidden>
        <span className={styles.arrow} />
      </span>
      <span className={styles.label}>{children}</span>
    </Link>
  );
}
