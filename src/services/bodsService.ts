import { supabase } from "@/integrations/supabase/client";

export interface LiveDeparture {
  lineRef: string;
  lineName: string;
  destination: string;
  origin: string;
  mode: "bus" | "train";
  aimedDepartureTime: string;
  expectedDepartureTime: string;
  status: "on-time" | "delayed" | "early";
  delayMinutes: number;
  minutesAway: number | null;
  stopPointRef: string;
  operatorRef: string;
  vehicleRef: string;
  recordedAtTime: string;
  occupancy: string | null;
  location: { lng: number; lat: number } | null;
}

export interface BodsResponse {
  departures: LiveDeparture[];
  updatedAt: string;
  source: "live" | "error";
  error?: string;
}

export interface TimetableDataset {
  id: number;
  name: string;
  operatorName: string;
  noc: string[];
  lines: string[];
  description: string;
  status: string;
  url: string;
  firstStartDate: string;
  firstEndDate: string;
}

export interface TimetableResponse {
  datasets: TimetableDataset[];
  count: number;
  updatedAt: string;
  source: "live" | "error";
  error?: string;
}

export interface Bbox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

const CACHE_TTL_MS = 10_000;
const responseCache = new Map<string, { expiresAt: number; response: BodsResponse | TimetableResponse }>();
const inFlightRequests = new Map<string, Promise<BodsResponse | TimetableResponse>>();

async function invokeBodsProxy<T extends BodsResponse | TimetableResponse>(body: Record<string, unknown>): Promise<T> {
  const key = JSON.stringify(body);
  const cached = responseCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.response as T;

  const existing = inFlightRequests.get(key);
  if (existing) return existing as Promise<T>;

  const request = supabase.functions
    .invoke("bods-proxy", { body })
    .then(({ data, error }) => {
      if (error) throw error;
      responseCache.set(key, { expiresAt: Date.now() + CACHE_TTL_MS, response: data as T });
      return data as T;
    })
    .finally(() => {
      inFlightRequests.delete(key);
    });

  inFlightRequests.set(key, request);
  return request;
}

export async function fetchLiveDepartures(
  lines: string[] | undefined,
  bbox: Bbox,
): Promise<BodsResponse> {
  if (!bbox) {
    return {
      departures: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: "Bounding box required",
    };
  }
  try {
    const body: Record<string, unknown> = {
      endpoint: "datafeed",
      boundingBox: bbox,
      stopCodes: [],
    };
    if (lines && lines.length > 0) body.lineNames = lines;

    return await invokeBodsProxy<BodsResponse>(body);
  } catch (err) {
    return {
      departures: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function fetchTimetableDatasets(
  searchTerm: string | undefined,
  noc: string[] | undefined,
  bbox: Bbox,
): Promise<TimetableResponse> {
  if (!bbox) {
    return {
      datasets: [],
      count: 0,
      updatedAt: new Date().toISOString(),
      source: "error",
      error: "Bounding box required",
    };
  }
  try {
    const body: Record<string, unknown> = {
      endpoint: "timetable",
      search: searchTerm,
      noc,
      limit: 20,
      boundingBox: bbox,
    };

    return await invokeBodsProxy<TimetableResponse>(body);
  } catch (err) {
    return {
      datasets: [],
      count: 0,
      updatedAt: new Date().toISOString(),
      source: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
