import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";
import { planJourney, type JourneyOption } from "@/services/journeyPlannerService";

const CACHE_MS = 30_000;

function timeToMinutesFromNow(hhmm: string): number | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const now = new Date();
  const dep = new Date();
  dep.setHours(Number(m[1]), Number(m[2]), 0, 0);
  let diff = (dep.getTime() - now.getTime()) / 60000;
  // if departure looks like it was earlier today by a lot, assume tomorrow
  if (diff < -120) diff += 24 * 60;
  return Math.round(diff);
}

const LeaveNowNudge = () => {
  const { savedRoutes } = useSavedRoutes();
  const navigate = useNavigate();
  const cacheRef = useRef<{ key: string; at: number; options: JourneyOption[] } | null>(null);
  const [options, setOptions] = useState<JourneyOption[]>([]);
  const [tick, setTick] = useState(0);

  const route = savedRoutes[0];

  useEffect(() => {
    if (!route) return;
    const key = `${route.from_place}|${route.to_place}`;
    const now = Date.now();
    if (cacheRef.current && cacheRef.current.key === key && now - cacheRef.current.at < CACHE_MS) {
      setOptions(cacheRef.current.options);
      return;
    }
    let cancelled = false;
    planJourney(
      route.from_place,
      route.to_place,
      route.from_coords ?? undefined,
      route.to_coords ?? undefined
    ).then((res) => {
      if (cancelled) return;
      cacheRef.current = { key, at: Date.now(), options: res.options };
      setOptions(res.options);
    });
    return () => {
      cancelled = true;
    };
  }, [route?.id, route?.from_place, route?.to_place]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  if (!route || options.length === 0) return null;

  // Find soonest upcoming departure
  const candidates = options
    .map((o) => ({ opt: o, mins: timeToMinutesFromNow(o.departureTime) }))
    .filter((c): c is { opt: JourneyOption; mins: number } => c.mins !== null && c.mins >= -1)
    .sort((a, b) => a.mins - b.mins);

  const next = candidates[0];
  if (!next) return null;
  const mins = next.mins;
  if (mins > 45) return null;
  if (mins < -1) return null;

  const opt = next.opt;
  const transitLegs = opt.legs.filter((l) => l.mode !== "walk");
  const firstLeg = transitLegs[0] || opt.legs[0];
  const lastLeg = opt.legs[opt.legs.length - 1];
  const firstTransitFrom = transitLegs[0]?.from || opt.legs[0]?.from || "your stop";

  const urgent = mins <= 2;

  // Use tick to force re-render reading; the variable is referenced via the time computation above
  void tick;

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() =>
        navigate("/routes", {
          state: {
            from: route.from_place,
            to: route.to_place,
            fromCoords: route.from_coords ?? undefined,
            toCoords: route.to_coords ?? undefined,
          },
        })
      }
      className={`w-full text-left rounded-2xl p-4 mb-4 shadow-lg text-white ${
        urgent
          ? "bg-gradient-to-br from-red-500 to-rose-600"
          : "bg-gradient-to-br from-orange-500 to-amber-500"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
          <Bell className="w-5 h-5 animate-pulse" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base font-display font-bold leading-tight">
            {urgent ? "Leave NOW" : `Leave in ${mins} min${mins === 1 ? "" : "s"}`}
          </p>
          <p className="text-sm opacity-95 mt-0.5">
            Your {firstLeg?.line || "service"} to {lastLeg?.to || route.to_place} departs at{" "}
            {opt.departureTime}
          </p>
          <p className="text-xs opacity-85 mt-1">Head to {firstTransitFrom} now</p>
        </div>
        <span className="text-xs font-semibold underline whitespace-nowrap pt-1">View route</span>
      </div>
    </motion.button>
  );
};

export default LeaveNowNudge;
