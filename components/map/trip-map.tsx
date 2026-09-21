"use client";

import { useEffect } from "react";
import {
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";

type Point = { lat: number; lng: number; label?: string };

const flameIcon = (letter: string) =>
  L.divIcon({
    className: "",
    html: `<div style="width:28px;height:28px;border-radius:999px;background:${letter === "B" ? "#d20f45" : "#14161c"};color:#f6f7f9;display:grid;place-items:center;font-weight:800;font-size:12px;box-shadow:0 2px 0 #0a0b0e">${letter}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

const currentIcon = L.divIcon({
  className: "",
  html: `<div style="position:relative;width:22px;height:22px"><span style="position:absolute;inset:0;border-radius:999px;background:#2563eb;opacity:.25;animation:cc-ping 1.6s ease-out infinite"></span><span style="position:absolute;inset:5px;border-radius:999px;background:#2563eb;border:2px solid #fff;box-shadow:0 1px 3px rgba(0,0,0,.35)"></span></div>`,
  iconSize: [22, 22],
  iconAnchor: [11, 11],
});

function Fit({ points }: { points: Point[] }) {
  const map = useMap();
  useEffect(() => {
    const valid = points.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng));
    if (valid.length === 0) return;
    if (valid.length === 1) {
      map.setView([valid[0].lat, valid[0].lng], 13);
      return;
    }
    const bounds = L.latLngBounds(valid.map((p) => [p.lat, p.lng] as [number, number]));
    map.fitBounds(bounds, { padding: [28, 28] });
  }, [map, points]);
  return null;
}

function ClickCatch({ onClick }: { onClick?: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(event) {
      onClick?.(event.latlng.lat, event.latlng.lng);
    },
  });
  return null;
}

export function TripMap({
  origin,
  destination,
  current,
  onMapClick,
  className = "h-72",
}: {
  origin?: Point | null;
  destination?: Point | null;
  /** Last shared live location during a trip. */
  current?: Point | null;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
}) {
  const points = [origin, destination, current].filter(Boolean) as Point[];
  const center: [number, number] = points[0]
    ? [points[0].lat, points[0].lng]
    : [13.7563, 100.5018];

  return (
    <div className={`overflow-hidden rounded-[24px] ${className}`}>
      <MapContainer
        center={center}
        zoom={12}
        className="h-full w-full"
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit points={points} />
        {onMapClick ? <ClickCatch onClick={onMapClick} /> : null}
        {origin ? (
          <Marker position={[origin.lat, origin.lng]} icon={flameIcon("A")} />
        ) : null}
        {destination ? (
          <Marker position={[destination.lat, destination.lng]} icon={flameIcon("B")} />
        ) : null}
        {current ? <Marker position={[current.lat, current.lng]} icon={currentIcon} zIndexOffset={1000} /> : null}
        {origin && destination ? (
          <Polyline
            positions={[
              [origin.lat, origin.lng],
              [destination.lat, destination.lng],
            ]}
            pathOptions={{ color: "#d20f45", weight: 4, dashArray: "8 8" }}
          />
        ) : null}
      </MapContainer>
    </div>
  );
}
