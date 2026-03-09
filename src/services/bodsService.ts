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

// Wider Leeds/Bradford area bounding box
const LEEDS_BBOX = {
  minLat: 53.75,
  maxLat: 53.87,
  minLon: -1.70,
  maxLon: -1.45,
};

// Lines shown in the app
const TRACKED_LINES = ["72", "X6", "110"];

export async function fetchLiveDepartures(
  lines?: string[],
  bbox?: typeof LEEDS_BBOX
): Promise<BodsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body: {
        endpoint: "datafeed",
        boundingBox: bbox || LEEDS_BBOX,
        lineNames: lines || TRACKED_LINES,
        stopCodes: [],
      },
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
  noc?: string[]
): Promise<TimetableResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body: {
        endpoint: "timetable",
        search: searchTerm,
        noc,
        limit: 20,
        boundingBox: LEEDS_BBOX,
      },
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
