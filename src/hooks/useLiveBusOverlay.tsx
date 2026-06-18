import { useEffect, useState } from "react";
import { fetchLiveDepartures } from "@/services/bodsService";
import type { JourneyOption } from "@/services/journeyPlannerService";

interface Bbox {
  minLat: number;
  maxLat: number;
  minLon: number;
  maxLon: number;
}

export function useLiveBusOverlay(
  options: JourneyOption[],
  bbox: Bbox | null
): JourneyOption[] {
  const [overlaid, setOverlaid] = useState<JourneyOption[]>(options);

  useEffect(() => {
    setOverlaid(options);
    if (!bbox || options.length === 0) return;

    const busLines = new Set<string>();
    for (const opt of options) {
      for (const leg of opt.legs) {
        if (leg.mode === "bus" && leg.line && leg.line !== "Walk") {
          busLines.add(leg.line.trim().toLowerCase());
        }
      }
    }
    if (busLines.size === 0) return;

    let cancelled = false;
    fetchLiveDepartures(undefined, bbox).then((result) => {
      if (cancelled) return;
      if (result.source === "error" || result.departures.length === 0) return;

      const liveByLine = new Map<string, { delayMins: number; occupancy: string | null }>();
      for (const dep of result.departures) {
        const key = (dep.lineName || dep.lineRef || "").trim().toLowerCase();
        if (!key) continue;
        if (!liveByLine.has(key)) {
          liveByLine.set(key, {
            delayMins: dep.delayMinutes ?? 0,
            occupancy: dep.occupancy ?? null,
          });
        }
      }

      const merged = options.map((opt) => ({
        ...opt,
        legs: opt.legs.map((leg) => {
          if (leg.mode !== "bus") return leg;
          const live = liveByLine.get(leg.line.trim().toLowerCase());
          if (!live) return leg;
          return {
            ...leg,
            liveDelayMins: live.delayMins,
            liveOccupancy: live.occupancy ?? undefined,
          };
        }),
      }));
      setOverlaid(merged);
    });

    return () => {
      cancelled = true;
    };
  }, [options, bbox]);

  return overlaid;
}
