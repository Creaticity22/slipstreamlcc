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

// Headingley area bounding box (Leeds)
const HEADINGLEY_BBOX = {
  minLat: 53.815,
  maxLat: 53.835,
  minLon: -1.595,
  maxLon: -1.560,
};

// Lines shown in the app
const TRACKED_LINES = ["72", "X6", "110"];

// NaPTAN stop codes near Headingley Lane (can be extended)
const NEARBY_STOP_CODES = [
  "450010887", // Headingley Lane (towards city)
  "450010886", // Headingley Lane (away from city)
  "450014205",
  "450010888",
];

export async function fetchLiveDepartures(): Promise<BodsResponse> {
  try {
    const { data, error } = await supabase.functions.invoke("bods-proxy", {
      body: {
        boundingBox: HEADINGLEY_BBOX,
        lineNames: TRACKED_LINES,
        stopCodes: NEARBY_STOP_CODES,
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
