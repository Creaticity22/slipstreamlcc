import { BodsProxyAuthError, callBodsProxy } from "@/services/bodsProxyClient";

export interface NaptanStop {
  atcoCode: string;
  name: string;
  indicator: string;
  street: string;
  locality: string;
  bearing: string;
  lat: number;
  lng: number;
  stopType: string;
  distanceKm: number;
}

export interface NaptanResponse {
  stops: NaptanStop[];
  count: number;
  source: "live" | "cached" | "error";
  updatedAt: string;
  error?: string;
}

export async function fetchNearbyStops(
  lat: number,
  lng: number,
  radiusKm = 1
): Promise<NaptanResponse> {
  try {
    return await callBodsProxy<NaptanResponse>({
      endpoint: "naptan",
      lat,
      lng,
      radiusKm,
    });
  } catch (err) {
    console.error("Failed to fetch NaPTAN data:", err);
    return {
      stops: [],
      count: 0,
      source: "error",
      updatedAt: new Date().toISOString(),
      error: err instanceof BodsProxyAuthError ? "Sign in to see nearby stops" : err instanceof Error ? err.message : "Unknown error",
    };
  }
}

/** Format a stop name nicely, e.g. "Stop A3 on High Street" */
export function formatStopLabel(stop: NaptanStop): string {
  const parts: string[] = [];
  if (stop.name) parts.push(stop.name);
  if (stop.indicator && stop.indicator !== "*" && stop.indicator !== "---") {
    parts.push(`(${stop.indicator})`);
  }
  if (stop.street && stop.street !== "*" && stop.street !== "Unknown") {
    parts.push(`on ${stop.street}`);
  }
  return parts.join(" ") || "Bus stop";
}
