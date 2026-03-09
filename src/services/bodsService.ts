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

// Wider Leeds/Bradford area bounding box to capture more buses
const LEEDS_BBOX = {
  minLat: 53.75,
  maxLat: 53.87,
  minLon: -1.70,
  maxLon: -1.45,
};

// Lines shown in the app
const TRACKED_LINES = ["72", "X6", "110"];

export async function fetchLiveDepartures(): Promise<BodsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body: {
        boundingBox: LEEDS_BBOX,
        lineNames: TRACKED_LINES,
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
