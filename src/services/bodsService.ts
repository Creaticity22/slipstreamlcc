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

// England-wide bounding box as default for national coverage
const ENGLAND_BBOX = {
  minLat: 49.9,
  maxLat: 55.8,
  minLon: -5.7,
  maxLon: 1.8,
};

export async function fetchLiveDepartures(
  lines?: string[],
  bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): Promise<BodsResponse> {
  try {
    const body: Record<string, unknown> = {
      endpoint: "datafeed",
      boundingBox: bbox || ENGLAND_BBOX,
      stopCodes: [],
    };
    if (lines && lines.length > 0) body.lineNames = lines;

    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body,
    });

    if (error) {
      console.error("Edge function error:", error);
      return {
        departures: [],
        updatedAt: new Date().toISOString(),
        source: "error",
        error: error.message,
      };
    }

    return data as BodsResponse;
  } catch (err) {
    console.error("Failed to fetch BODS data:", err);
    return {
      departures: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function fetchTimetableDatasets(
  searchTerm?: string,
  noc?: string[],
  bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number }
): Promise<TimetableResponse> {
  try {
    const body: Record<string, unknown> = {
      endpoint: "timetable",
      search: searchTerm,
      noc,
      limit: 20,
      boundingBox: bbox || ENGLAND_BBOX,
    };

    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body,
    });

    if (error) {
      console.error("Timetable edge function error:", error);
      return {
        datasets: [],
        count: 0,
        updatedAt: new Date().toISOString(),
        source: "error",
        error: error.message,
      };
    }

    return data as TimetableResponse;
  } catch (err) {
    console.error("Failed to fetch timetable data:", err);
    return {
      datasets: [],
      count: 0,
      updatedAt: new Date().toISOString(),
      source: "error",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}
