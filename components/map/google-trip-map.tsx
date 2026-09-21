"use client";

import { useEffect, useRef, useState } from "react";

type Point = { lat: number; lng: number };

const BANGKOK = { lat: 13.7563, lng: 100.5018 };
let loader: Promise<void> | null = null;

/** Loads the Maps JavaScript API once per page. */
function loadGoogleMaps(apiKey: string) {
  if (typeof (window as { google?: typeof google }).google?.maps?.importLibrary === "function") return Promise.resolve();
  loader ??= new Promise<void>((resolve, reject) => {
    const callback = "__careCompanionMapsReady";
    (window as unknown as Record<string, () => void>)[callback] = () => resolve();
    const script = document.createElement("script");
    const params = new URLSearchParams({ key: apiKey, v: "weekly", loading: "async", language: "th", region: "TH", callback });
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    script.async = true;
    script.onerror = () => {
      loader = null;
      reject(new Error("google_maps_load_failed"));
    };
    document.head.append(script);
  });
  return loader;
}

function currentElement() {
  const el = document.createElement("div");
  el.style.cssText =
    "width:18px;height:18px;border-radius:999px;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 6px rgba(37,99,235,.25),0 1px 3px rgba(0,0,0,.35)";
  return el;
}

function pinElement(letter: "A" | "B") {
  const el = document.createElement("div");
  el.textContent = letter;
  el.style.cssText = `width:30px;height:30px;border-radius:999px;background:${letter === "B" ? "#d20f45" : "#14161c"};color:#f6f7f9;display:grid;place-items:center;font:800 12px system-ui;box-shadow:0 2px 0 #0a0b0e;border:2px solid #f6f7f9`;
  return el;
}

export function GoogleTripMap({
  apiKey,
  origin,
  destination,
  current,
  onMapClick,
  className = "h-72",
  onFailure,
}: {
  apiKey: string;
  origin?: Point | null;
  destination?: Point | null;
  current?: Point | null;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  onFailure?: () => void;
}) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const markers = useRef<{
    A?: google.maps.marker.AdvancedMarkerElement;
    B?: google.maps.marker.AdvancedMarkerElement;
    C?: google.maps.marker.AdvancedMarkerElement;
  }>({});
  const line = useRef<google.maps.Polyline | null>(null);
  const clickRef = useRef(onMapClick);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    clickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    let cancelled = false;
    // Maps reports a bad or restricted key through this global instead of rejecting.
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => onFailure?.();

    loadGoogleMaps(apiKey)
      .then(async () => {
        const { Map } = (await google.maps.importLibrary("maps")) as google.maps.MapsLibrary;
        await google.maps.importLibrary("marker");
        if (cancelled || !container.current) return;
        map.current = new Map(container.current, {
          center: BANGKOK,
          zoom: 12,
          mapId: "DEMO_MAP_ID",
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: "cooperative",
        });
        map.current.addListener("click", (event: google.maps.MapMouseEvent) => {
          if (event.latLng) clickRef.current?.(event.latLng.lat(), event.latLng.lng());
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) onFailure?.();
      });

    return () => {
      cancelled = true;
    };
  }, [apiKey, onFailure]);

  useEffect(() => {
    const gmap = map.current;
    if (!ready || !gmap) return;

    for (const [letter, point] of [
      ["A", origin],
      ["B", destination],
      ["C", current],
    ] as const) {
      const existing = markers.current[letter];
      if (!point) {
        if (existing) existing.map = null;
        delete markers.current[letter];
        continue;
      }
      if (existing) existing.position = point;
      else
        markers.current[letter] = new google.maps.marker.AdvancedMarkerElement({
          map: gmap,
          position: point,
          content: letter === "C" ? currentElement() : pinElement(letter),
          zIndex: letter === "C" ? 10 : 1,
        });
    }

    line.current?.setMap(null);
    line.current = null;
    if (origin && destination) {
      line.current = new google.maps.Polyline({
        map: gmap,
        path: [origin, destination],
        strokeOpacity: 0,
        icons: [{ icon: { path: "M 0,-1 0,1", strokeOpacity: 1, strokeColor: "#d20f45", scale: 3 }, offset: "0", repeat: "14px" }],
      });
      const bounds = new google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      gmap.fitBounds(bounds, 40);
    } else if (origin || destination) {
      gmap.panTo((origin ?? destination) as Point);
    }
  }, [ready, origin, destination, current]);

  return (
    <div className={`relative overflow-hidden rounded-[24px] bg-mist ${className}`}>
      <div ref={container} className="h-full w-full" />
      {!ready ? (
        <div className="absolute inset-0 grid place-items-center text-sm text-ink-soft">Google Maps…</div>
      ) : null}
    </div>
  );
}
