import { GeoPosition } from "@/hooks/useGeolocation";

export interface WalkingStep {
  instruction: string;
  distance: number; // metres
  duration: number; // seconds
  maneuver: string;
}

export interface WalkingRoute {
  totalDistance: number; // metres
  totalDuration: number; // seconds
  steps: WalkingStep[];
  geometry: [number, number][]; // [lat, lng] pairs for polyline
}

const OSRM_BASE = "https://router.project-osrm.org/route/v1/foot";

function decodePolyline(encoded: string): [number, number][] {
  const points: [number, number][] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    points.push([lat / 1e5, lng / 1e5]);
  }
  return points;
}

function humanInstruction(maneuver: string, name: string): string {
  const road = name || "the road";
  switch (maneuver) {
    case "turn-left": return `Turn left onto ${road}`;
    case "turn-right": return `Turn right onto ${road}`;
    case "turn-slight-left": return `Bear left onto ${road}`;
    case "turn-slight-right": return `Bear right onto ${road}`;
    case "straight": return `Continue straight on ${road}`;
    case "depart": return `Head along ${road}`;
    case "arrive": return `You've arrived 🎉`;
    case "roundabout": return `At the roundabout, continue on ${road}`;
    default: return `Continue on ${road}`;
  }
}

export async function getWalkingDirections(
  from: GeoPosition,
  toLat: number,
  toLng: number
): Promise<WalkingRoute | null> {
  try {
    const url = `${OSRM_BASE}/${from.lng},${from.lat};${toLng},${toLat}?overview=full&geometries=polyline&steps=true`;
    const res = await fetch(url);
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    const leg = route.legs[0];

    const steps: WalkingStep[] = leg.steps.map((s: any) => ({
      instruction: humanInstruction(s.maneuver?.modifier || s.maneuver?.type || "", s.name || ""),
      distance: s.distance,
      duration: s.duration,
      maneuver: s.maneuver?.type || "",
    }));

    const geometry = decodePolyline(route.geometry);

    return {
      totalDistance: route.distance,
      totalDuration: route.duration,
      steps,
      geometry,
    };
  } catch (err) {
    console.error("Walking directions error:", err);
    return null;
  }
}

export function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

export function formatWalkTime(seconds: number): string {
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "< 1 min";
  return `${mins} min`;
}
