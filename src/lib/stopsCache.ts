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
  { atcoCode: "stub-leeds-bus-stn", commonName: "Leeds Bus Station", lat: 53.7960, lng: -1.5400, indicator: "Stand" },
  { atcoCode: "stub-leeds-rail-stn", commonName: "Leeds Rail Station", lat: 53.7955, lng: -1.5491, indicator: "Forecourt" },
  { atcoCode: "stub-headingley", commonName: "Headingley", lat: 53.8200, lng: -1.5800, indicator: "Stop A" },
  { atcoCode: "stub-hyde-park", commonName: "Hyde Park Corner", lat: 53.8120, lng: -1.5660, indicator: "Stop B" },
  { atcoCode: "stub-univ-leeds", commonName: "University of Leeds", lat: 53.8067, lng: -1.5550, indicator: "Stop C" },
] as unknown as NaptanStop[];

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
