import type { ComponentProps, ReactNode } from "react";
import styles from "./field.module.css";

export function Field({
  label,
  hint,
  error,
  required,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={styles.root}>
      <span className={styles.label}>
        {label}
        {required ? (
          <span className={styles.required}>
            {" "}
            *<span className="sr-only"> จำเป็น</span>
          </span>
        ) : null}
      </span>
      {children}
      {hint && !error ? <span className={styles.hint}>{hint}</span> : null}
      {error ? (
        <span className={styles.error} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

export function Input({ className = "", ...props }: ComponentProps<"input">) {
  return <input className={`${styles.control} ${className}`} {...props} />;
}

export function Textarea({ className = "", ...props }: ComponentProps<"textarea">) {
  return (
    <textarea className={`${styles.control} ${styles.area} ${className}`} {...props} />
  );
}

export function Select({ className = "", ...props }: ComponentProps<"select">) {
  return (
    <select
      className={`${styles.control} ${props.multiple ? styles.tall : ""} ${className}`}
      {...props}
    />
  );
}
