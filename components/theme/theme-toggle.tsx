"use client";

import { useRef, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { applyTheme } from "@/lib/theme";
import styles from "./theme-toggle.module.css";

/** The theme lives on <html class="dark">, so read it from there instead of copying it into state. */
function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function isDarkNow() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle() {
  const t = useTranslations("nav");
  const dark = useSyncExternalStore(subscribeToTheme, isDarkNow, () => false);
  const toggleRef = useRef<HTMLSpanElement>(null);

  function switchTheme() {
    const next = !dark;
    const commit = () => applyTheme(next ? "dark" : "light");

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!document.startViewTransition || reduced) {
      commit();
      return;
    }

    // Circle reveal of the new theme, growing out from the toggle.
    const box = toggleRef.current?.getBoundingClientRect();
    const x = box ? box.left + box.width / 2 : window.innerWidth - 80;
    const y = box ? box.top + box.height / 2 : 40;
    const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(commit);
    transition.ready
      .then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 550, easing: "cubic-bezier(0.22, 1, 0.36, 1)", pseudoElement: "::view-transition-new(root)" },
        );
      })
      .catch(() => {});
  }


  return (
    <label className={styles.root}>
      <span className="sr-only">{dark ? t("themeToLight") : t("themeToDark")}</span>
      <span ref={toggleRef} className={styles.toggle}>
        <input
          className={styles.input}
          type="checkbox"
          role="switch"
          checked={dark}
          aria-checked={dark}
          onChange={switchTheme}
        />
        <span className={styles.button} aria-hidden />
        <span className={styles.label} aria-hidden>
          {dark ? "☾" : "☼"}
        </span>
      </span>
    </label>
  );
}
