"use client";

import { useEffect, useState } from "react";

const TYPE_MS = 85;
const DELETE_MS = 45;
const HOLD_MS = 2200;

/** Splits into grapheme clusters so Thai vowels and tone marks stay attached to their consonant. */
function graphemes(text: string) {
  if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
    return Array.from(new Intl.Segmenter(undefined, { granularity: "grapheme" }).segment(text), (s) => s.segment);
  }
  return Array.from(text);
}

export function Typewriter({ phrases, className = "" }: { phrases: string[]; className?: string }) {
  const [index, setIndex] = useState(0);
  const [length, setLength] = useState(() => graphemes(phrases[0] ?? "").length);
  const [deleting, setDeleting] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setAnimate(!reduced.matches && phrases.length > 1);
    const id = window.setTimeout(sync, 0);
    reduced.addEventListener("change", sync);
    return () => {
      window.clearTimeout(id);
      reduced.removeEventListener("change", sync);
    };
  }, [phrases.length]);

  const parts = graphemes(phrases[index] ?? "");

  useEffect(() => {
    if (!animate) return;
    let delay = deleting ? DELETE_MS : TYPE_MS;
    let step: () => void;

    if (!deleting && length >= parts.length) {
      delay = HOLD_MS;
      step = () => setDeleting(true);
    } else if (deleting && length === 0) {
      delay = 350;
      step = () => {
        setDeleting(false);
        setIndex((current) => (current + 1) % phrases.length);
      };
    } else {
      step = () => setLength((current) => current + (deleting ? -1 : 1));
    }

    const id = window.setTimeout(step, delay);
    return () => window.clearTimeout(id);
  }, [animate, deleting, length, parts.length, phrases.length]);

  return (
    <span className={`typewriter ${className}`} aria-hidden>
      {parts.slice(0, animate ? length : parts.length).join("")}
      {animate ? <span className="typewriter__caret" /> : null}
    </span>
  );
}
