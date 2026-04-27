import type { NaptanStop } from "@/services/naptanService";

const KEY = "slipstream:cachedStops:v1";
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedPayload {
  stops: NaptanStop[];
  savedAt: number;
  centerLat?: number;
  centerLng?: number;
}

// A tiny set of well-known Leeds-area stub stops used when no cache exists
// and the live providers are unavailable. Coordinates are approximate but
// real, so the friendly fallback still feels meaningful.
const STUB_STOPS: NaptanStop[] = [
  { atcoCode: "stub-leeds-bus-stn", name: "Leeds Bus Station", indicator: "Stand", street: "Dyer Street", locality: "Leeds", bearing: "", lat: 53.7960, lng: -1.5400, stopType: "BCT", distanceKm: 0 },
  { atcoCode: "stub-leeds-rail-stn", name: "Leeds Rail Station", indicator: "Forecourt", street: "New Station Street", locality: "Leeds", bearing: "", lat: 53.7955, lng: -1.5491, stopType: "BCT", distanceKm: 0 },
  { atcoCode: "stub-headingley", name: "Headingley", indicator: "Stop A", street: "Otley Road", locality: "Headingley", bearing: "", lat: 53.8200, lng: -1.5800, stopType: "BCT", distanceKm: 0 },
  { atcoCode: "stub-hyde-park", name: "Hyde Park Corner", indicator: "Stop B", street: "Headingley Lane", locality: "Hyde Park", bearing: "", lat: 53.8120, lng: -1.5660, stopType: "BCT", distanceKm: 0 },
  { atcoCode: "stub-univ-leeds", name: "University of Leeds", indicator: "Stop C", street: "Woodhouse Lane", locality: "Leeds", bearing: "", lat: 53.8067, lng: -1.5550, stopType: "BCT", distanceKm: 0 },
];

export function cacheStops(stops: NaptanStop[], centerLat?: number, centerLng?: number) {
  if (!stops.length) return;
  try {
    const payload: CachedPayload = { stops, savedAt: Date.now(), centerLat, centerLng };
    localStorage.setItem(KEY, JSON.stringify(payload));
  } catch {
    // ignore quota / SSR errors
  }
}

export function getCachedStops(): { stops: NaptanStop[]; savedAt: number | null; isStub: boolean } {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CachedPayload;
      const fresh = Date.now() - parsed.savedAt < MAX_AGE_MS;
      if (fresh && parsed.stops?.length) {
        return { stops: parsed.stops, savedAt: parsed.savedAt, isStub: false };
      }
    }
  } catch {
    // fall through to stub
  }
  return { stops: STUB_STOPS, savedAt: null, isStub: true };
}
