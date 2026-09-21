/** Matches cobe 2 marker projection so labels sit on the same lat/lng as the dots.
 *  Ported from the middle/KlangSure landing globe. */

export const GLOBE_RADIUS = 0.8;
/** Centers Bangkok (13.76, 100.50) on the visible face. */
export const FOCUS_PHI = 2.96;
export const FOCUS_THETA = 0.18;
export const GLOBE_SCALE = 1.08;
export const MARKER_ELEVATION = 0.03;

export function latLngToCartesian(lat: number, lng: number): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  return [-cosLat * Math.cos(lngRad), Math.sin(latRad), cosLat * Math.sin(lngRad)];
}

export function projectGlobePoint(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  options: { scale?: number; elevation?: number; aspect?: number } = {},
) {
  const scale = options.scale ?? GLOBE_SCALE;
  const elevation = options.elevation ?? MARKER_ELEVATION;
  const aspect = options.aspect ?? 1;
  const [x0, y0, z0] = latLngToCartesian(lat, lng);
  const radius = GLOBE_RADIUS + elevation;
  const px = x0 * radius;
  const py = y0 * radius;
  const pz = z0 * radius;
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);
  const cosTheta = Math.cos(theta);
  const sinTheta = Math.sin(theta);
  const sx = cosPhi * px + sinPhi * pz;
  const sy = sinPhi * sinTheta * px + cosTheta * py - cosPhi * sinTheta * pz;
  const sz = -sinPhi * cosTheta * px + sinTheta * py + cosPhi * cosTheta * pz;
  return {
    x: ((sx / aspect) * scale + 1) / 2,
    y: (-sy * scale + 1) / 2,
    visible: sz >= 0 || sx * sx + sy * sy >= GLOBE_RADIUS * GLOBE_RADIUS,
  };
}
