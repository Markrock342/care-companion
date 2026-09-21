import type { ReactNode } from "react";
import styles from "./glow-card.module.css";

export function GlowCard({
  value,
  label,
}: {
  value: ReactNode;
  label: string;
}) {
  return (
    <article className={styles.root}>
      <div className={styles.value}>{value}</div>
      <p className={styles.label}>{label}</p>
    </article>
  );
}
