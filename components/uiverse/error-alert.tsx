import styles from "./error-alert.module.css";

export function ErrorAlert({
  heading,
  items,
}: {
  heading: string;
  items: string[];
}) {
  return (
    <div className={styles.root} role="alert">
      <div className={styles.alert}>
        <div className={styles.iconWrap}>
          <svg
            aria-hidden
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
            className={styles.icon}
          >
            <path
              clipRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              fillRule="evenodd"
            />
          </svg>
        </div>
        <div className={styles.body}>
          <p className={styles.heading}>{heading}</p>
          {items.length > 0 ? (
            <ul className={styles.list}>
              {items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  );
}
