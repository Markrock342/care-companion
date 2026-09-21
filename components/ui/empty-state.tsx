import type { ReactNode } from "react";
import styles from "./empty-state.module.css";

export function EmptyState({
  title,
  hint,
  action,
}: {
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className={styles.root}>
      <div className={styles.mark} aria-hidden>
        <span className={styles.dot}>A</span>
        <span className={styles.line} />
        <span className={styles.dot}>B</span>
      </div>
      <p className={styles.title}>{title}</p>
      {hint ? <p className={styles.hint}>{hint}</p> : null}
      {action}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-2xl bg-mist ${className}`} aria-hidden />;
}
