import { supabase } from "@/integrations/supabase/client";

export interface JourneyLeg {
  mode: "bus" | "train" | "walk";
  line: string;
  from: string;
  to: string;
  durationMins: number;
  distanceM: number;
  departure: string;
  arrival: string;
  headsign?: string;
}

export interface JourneyOption {
  type: "fastest" | "least-changes" | "lowest-carbon";
  departureTime: string;
  arrivalTime: string;
  durationMins: number;
  changes: number;
  co2Kg: number;
  legs: JourneyLeg[];
}

export interface JourneyResult {
  options: JourneyOption[];
  error?: string;
  source: "live" | "error";
}

export async function planJourney(
  from: string,
  to: string,
  fromCoords?: { lat: number; lng: number },
  toCoords?: { lat: number; lng: number }
): Promise<JourneyResult> {
  try {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (sessionError || !accessToken || !sessionData.session?.user?.id) {
      return { options: [], error: "Sign in to plan a journey", source: "error" };
    }

    const res = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/journey-planner`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ from, to, fromCoords, toCoords }),
      }
    );

    const text = await res.text();
    const payload = text ? JSON.parse(text) : null;

    if (!res.ok) {
      return {
        options: [],
        error: payload?.error || `Journey planner returned ${res.status}`,
        source: "error",
      };
    }

    const options: JourneyOption[] = Array.isArray(payload?.options) ? payload.options : [];
    if (options.length === 0) {
      return { options: [], error: payload?.error || "No routes found", source: "error" };
    }
    return { options, source: "live" };
  } catch (e) {
    return {
      options: [],
      error: e instanceof Error ? e.message : "Journey planner unreachable",
      source: "error",
    };
  }
}
