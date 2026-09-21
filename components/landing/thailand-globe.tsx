"use client";

import createGlobe from "cobe";
import { useEffect, useRef, type CSSProperties } from "react";
import {
  FOCUS_PHI,
  FOCUS_THETA,
  GLOBE_SCALE,
  MARKER_ELEVATION,
  projectGlobePoint,
} from "@/lib/globe-project";

/** Idle spin speed in radians per second (a full turn takes about 1.5 minutes). */
const SPIN_SPEED = 0.07;
const DRAG_THETA_MAX = 0.32;
const CORAL: [number, number, number] = [0.82, 0.06, 0.27];
const GLOW: [number, number, number] = [0.98, 0.72, 0.78];
const BASE: [number, number, number] = [0.97, 0.86, 0.89];

type Pin = {
  id: string;
  label: string;
  location: [number, number];
  size: number;
  home?: boolean;
  /** Which side of the marker the callout sits on, and how far it shifts vertically (px). */
  side: "left" | "right";
  lift: number;
};

const CITIES: Pin[] = [
  { id: "bkk", label: "กรุงเทพฯ", location: [13.7563, 100.5018], size: 0.05, home: true, side: "right", lift: 0 },
  { id: "cnx", label: "เชียงใหม่", location: [18.7883, 98.9853], size: 0.03, side: "left", lift: -22 },
  { id: "hkt", label: "ภูเก็ต", location: [7.8804, 98.3923], size: 0.03, side: "left", lift: 14 },
  { id: "kkc", label: "ขอนแก่น", location: [16.4322, 102.8236], size: 0.03, side: "right", lift: -26 },
  { id: "hdy", label: "หาดใหญ่", location: [7.0084, 100.4767], size: 0.03, side: "right", lift: 22 },
];

function markerState(pins: Pin[]) {
  const bangkok: [number, number] = [13.7563, 100.5018];
  return {
    markers: pins.map((pin) => ({
      location: pin.location,
      size: pin.size,
      id: pin.id,
      color: pin.home ? CORAL : undefined,
    })),
    arcs: pins
      .filter((pin) => !pin.home)
      .map((pin) => ({
        from: pin.location,
        to: bangkok,
        id: `arc-${pin.id}`,
      })),
  };
}

export function ThailandGlobe({ hint }: { hint: string }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pins = CITIES;

  useEffect(() => {
    const stageEl = stageRef.current;
    if (!stageEl) return;
    const host: HTMLDivElement = stageEl;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let phi = FOCUS_PHI;
    let theta = FOCUS_THETA;
    let userPhi = 0;
    let userTheta = 0;
    let lastFrame: number | null = null;
    let pointerX: number | null = null;
    let pointerY: number | null = null;
    let frame = 0;
    let globe: ReturnType<typeof createGlobe> | null = null;
    let surface: HTMLCanvasElement | null = null;

    function cssSize() {
      return Math.max(32, Math.round(host.clientWidth || host.getBoundingClientRect().width));
    }

    function syncPins() {
      const box = host.getBoundingClientRect();
      const aspect = box.height > 0 ? box.width / box.height : 1;
      for (const el of host.querySelectorAll<HTMLElement>("[data-pin]")) {
        const id = el.dataset.pin;
        const pin = pins.find((row) => row.id === id);
        if (!pin) {
          el.style.opacity = "0";
          continue;
        }
        const projected = projectGlobePoint(pin.location[0], pin.location[1], phi, theta, {
          aspect,
        });
        if (!projected.visible) {
          el.style.opacity = "0";
          continue;
        }
        el.style.left = `${projected.x * 100}%`;
        el.style.top = `${projected.y * 100}%`;
        el.style.opacity = "1";
      }
    }

    function releaseContext(canvas: HTMLCanvasElement) {
      canvas.removeEventListener("webglcontextlost", onContextLost);
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    }

    function onContextLost(event: Event) {
      event.preventDefault();
      globe = null;
      surface = null;
      requestAnimationFrame(makeGlobe);
    }

    function teardown() {
      globe?.destroy();
      globe = null;
      if (surface) releaseContext(surface);
      const leftover = host.querySelectorAll("canvas[data-cobe]");
      leftover.forEach((node) => {
        const wrap = node.parentElement;
        node.remove();
        // cobe's wrapper also holds its anchor divs, so drop it whole.
        if (wrap && wrap !== host) wrap.remove();
      });
      surface = null;
    }

    function pinWrapper(canvas: HTMLCanvasElement) {
      const wrap = canvas.parentElement;
      if (wrap && wrap !== host) {
        wrap.style.cssText =
          "position:absolute;inset:0;width:100%;height:100%;pointer-events:none";
      }
      canvas.style.cssText =
        "display:block;width:100%;height:100%;position:absolute;inset:0;z-index:1;pointer-events:none";
    }

    function makeGlobe() {
      const size = cssSize();
      if (size < 120) return;
      teardown();
      const canvas = document.createElement("canvas");
      canvas.dataset.cobe = "1";
      canvas.setAttribute("aria-hidden", "true");
      host.insertBefore(canvas, host.firstChild);
      surface = canvas;
      try {
        // cobe returns a no-op globe instead of throwing when WebGL is unavailable.
        const contextAttrs = { alpha: true, antialias: true, preserveDrawingBuffer: true };
        if (!(canvas.getContext("webgl2", contextAttrs) ?? canvas.getContext("webgl", contextAttrs))) {
          throw new Error("WebGL unavailable");
        }
        globe = createGlobe(canvas, {
          devicePixelRatio: dpr,
          width: size,
          height: size,
          phi,
          theta,
          dark: 0,
          diffuse: 1.1,
          mapSamples: 40000,
          mapBrightness: 5,
          mapBaseBrightness: 0,
          scale: GLOBE_SCALE,
          offset: [0, 0],
          opacity: 1,
          baseColor: BASE,
          markerColor: CORAL,
          glowColor: GLOW,
          arcColor: CORAL,
          markerElevation: MARKER_ELEVATION,
          arcWidth: 0.4,
          arcHeight: 0.22,
          context: contextAttrs,
          ...markerState(pins),
        });
      } catch {
        canvas.remove();
        globe = null;
        surface = null;
        return;
      }
      canvas.addEventListener("webglcontextlost", onContextLost);
      pinWrapper(canvas);
      globe.update({ width: size, height: size, phi, theta });
    }

    function resize() {
      const size = cssSize();
      if (size < 120) return;
      if (globe && surface && surface.parentElement) {
        pinWrapper(surface);
        globe.update({ width: size, height: size });
        return;
      }
      makeGlobe();
    }

    const tick = (now: number) => {
      const dt = lastFrame === null ? 0 : Math.min((now - lastFrame) / 1000, 0.1);
      lastFrame = now;
      if (pointerX === null) {
        if (!reduced) {
          // Keep spinning from wherever the user left it; only the tilt eases back.
          userPhi += SPIN_SPEED * dt;
          userTheta *= 0.985;
        }
        phi = FOCUS_PHI + userPhi;
        theta = FOCUS_THETA + userTheta;
      }
      globe?.update({ phi, theta });
      syncPins();
      frame = requestAnimationFrame(tick);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (event.button !== 0) return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      host.setPointerCapture(event.pointerId);
      host.dataset.dragging = "1";
      event.preventDefault();
    };
    const onPointerMove = (event: PointerEvent) => {
      if (pointerX === null || pointerY === null) return;
      userPhi += (event.clientX - pointerX) / 240;
      userTheta = Math.max(
        -DRAG_THETA_MAX,
        Math.min(DRAG_THETA_MAX, userTheta + (event.clientY - pointerY) / 360),
      );
      pointerX = event.clientX;
      pointerY = event.clientY;
      phi = FOCUS_PHI + userPhi;
      theta = FOCUS_THETA + userTheta;
    };
    const onPointerUp = (event: PointerEvent) => {
      pointerX = null;
      pointerY = null;
      delete host.dataset.dragging;
      if (host.hasPointerCapture(event.pointerId)) host.releasePointerCapture(event.pointerId);
    };

    const start = () => {
      if (cssSize() < 120) {
        frame = requestAnimationFrame(start);
        return;
      }
      resize();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(start);
    host.addEventListener("pointerdown", onPointerDown);
    host.addEventListener("pointermove", onPointerMove);
    host.addEventListener("pointerup", onPointerUp);
    host.addEventListener("pointercancel", onPointerUp);
    const observer = new ResizeObserver(resize);
    observer.observe(host);

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      host.removeEventListener("pointerdown", onPointerDown);
      host.removeEventListener("pointermove", onPointerMove);
      host.removeEventListener("pointerup", onPointerUp);
      host.removeEventListener("pointercancel", onPointerUp);
      teardown();
    };
  }, []);

  return (
    <div className="globe-stage" ref={stageRef} aria-label={hint} role="img">
      {pins.map((pin) => (
        <span
          key={pin.id}
          className={`globe-pin${pin.home ? " is-home" : ""}`}
          data-pin={pin.id}
          data-side={pin.side}
          style={{ "--lift": `${pin.lift}px` } as CSSProperties}
          aria-hidden="true"
        >
          <span className="globe-pin__label">{pin.label}</span>
        </span>
      ))}
      <p className="globe-hint">{hint}</p>
    </div>
  );
}
