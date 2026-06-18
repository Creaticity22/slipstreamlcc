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
