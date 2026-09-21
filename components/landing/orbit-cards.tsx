import type { CSSProperties } from "react";
import styles from "./orbit-cards.module.css";

const COLORS = [
  "142, 249, 252",
  "142, 252, 204",
  "142, 252, 157",
  "215, 252, 142",
  "252, 252, 142",
  "252, 208, 142",
  "252, 142, 142",
  "252, 142, 239",
  "204, 142, 252",
  "142, 202, 252",
] as const;

export function OrbitCards({ labels }: { labels: string[] }) {
  const items = labels.slice(0, COLORS.length);
  const quantity = items.length || COLORS.length;

  return (
    <div className={styles.root}>
      <div className={styles.inner} style={{ "--quantity": quantity } as CSSProperties}>
        {items.map((label, index) => (
          <div
            key={`${label}-${index}`}
            className={styles.card}
            style={
              {
                "--index": index,
                "--color-card": COLORS[index],
              } as CSSProperties
            }
          >
            <div className={styles.face}>
              <p className={styles.label}>{label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
