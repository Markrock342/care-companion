"use client";

import dynamic from "next/dynamic";
import { useCallback, useState, type ComponentProps } from "react";
import { GoogleTripMap } from "./google-trip-map";

const LeafletTripMap = dynamic(
  () => import("./trip-map").then((mod) => mod.TripMap),
  {
    ssr: false,
    loading: () => (
      <div className="grid h-72 place-items-center rounded-[24px] bg-mist text-sm text-ink-soft">
        Map
      </div>
    ),
  },
);

const GOOGLE_MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

/** Google Maps when a key is configured; OpenStreetMap otherwise, or if Google fails to load. */
export function TripMap(props: ComponentProps<typeof LeafletTripMap>) {
  const [googleFailed, setGoogleFailed] = useState(false);
  const fail = useCallback(() => setGoogleFailed(true), []);

  if (GOOGLE_MAPS_KEY && !googleFailed) {
    return <GoogleTripMap apiKey={GOOGLE_MAPS_KEY} onFailure={fail} {...props} />;
  }
  return <LeafletTripMap {...props} />;
}
