import { motion } from "framer-motion";
import { Bus, Train, Footprints, Leaf, Zap, ArrowLeftRight, ArrowRight, Clock, Users } from "lucide-react";
import type { JourneyOption, JourneyLeg } from "@/services/journeyPlannerService";
import { getCarComparison, getTotalDistanceKm } from "@/lib/carbonComparison";


function OccupancyDot({ occupancy }: { occupancy: string }) {
  const o = occupancy.toLowerCase();
  const color =
    o.includes("full") || o.includes("standing")
      ? "bg-red-500"
      : o.includes("seats") || o.includes("available")
      ? "bg-emerald-500"
      : "bg-amber-400";
  const label =
    o.includes("full") || o.includes("standing")
      ? "Busy"
      : o.includes("seats") || o.includes("available")
      ? "Quiet"
      : "Medium";
  return (
    <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold text-white ${color}`}>
      <Users className="w-2.5 h-2.5" />
      {label}
    </span>
  );
}


type RouteType = JourneyOption["type"];

const typeConfig: Record<
  RouteType,
  { label: string; Icon: typeof Zap; gradient: string }
> = {
  fastest: { label: "Fastest", Icon: Zap, gradient: "bg-gradient-primary" },
  "least-changes": { label: "Least changes", Icon: ArrowLeftRight, gradient: "bg-gradient-cool" },
  "lowest-carbon": { label: "Lowest carbon", Icon: Leaf, gradient: "bg-gradient-warm" },
};

function legIcon(mode: JourneyLeg["mode"]) {
  if (mode === "bus") return Bus;
  if (mode === "train") return Train;
  return Footprints;
}

const RouteCard = (props: JourneyOption) => {
  const { type, departureTime, arrivalTime, durationMins, changes, co2Kg, legs } = props;
  const cfg = typeConfig[type];
  const TypeIcon = cfg.Icon;
  const changesLabel = changes === 0 ? "Direct" : changes === 1 ? "1 change" : `${changes} changes`;

  const distKm = getTotalDistanceKm(legs);
  const carComparison = getCarComparison(co2Kg, distKm);


  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl shadow-card border border-border p-4 space-y-3"
    >
      <div className="flex items-center justify-between">
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg text-xs font-semibold text-white ${cfg.gradient}`}>
          <TypeIcon className="w-3.5 h-3.5" />
          {cfg.label}
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Leaf className="w-3.5 h-3.5 text-emerald-500" />
          {co2Kg.toFixed(2)} kg CO₂e
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-display font-bold text-foreground leading-none">
            {durationMins}
            <span className="text-base font-semibold text-muted-foreground ml-1">min</span>
          </p>
          <p className="text-xs text-muted-foreground mt-1">{changesLabel}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-foreground">
            {departureTime} <ArrowRight className="inline w-3.5 h-3.5 mx-0.5 text-muted-foreground" /> {arrivalTime}
          </p>
        </div>
      </div>

      {carComparison && (
        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-950/30 px-2.5 py-1.5 rounded-lg">
          <span>🚗</span>
          <span>{carComparison}</span>
        </div>
      )}

      <div className="flex flex-wrap gap-1.5 pt-1">
        {legs.map((leg, i) => {
          const Icon = legIcon(leg.mode);
          return (
            <div key={i} className="flex items-center gap-1.5" title={`${leg.from} → ${leg.to}`}>
              <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-muted text-xs font-medium text-foreground">
                <Icon className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{leg.line}</span>
                <span className="text-muted-foreground">· {leg.durationMins}m</span>
              </div>
              {leg.liveDelayMins !== undefined && leg.liveDelayMins !== 0 && (
                <span className={`flex items-center gap-0.5 text-[10px] font-semibold ${
                  leg.liveDelayMins > 0 ? "text-red-500" : "text-emerald-500"
                }`}>
                  <Clock className="w-3 h-3" />
                  {leg.liveDelayMins > 0 ? `+${leg.liveDelayMins}m` : `${leg.liveDelayMins}m`}
                </span>
              )}
              {leg.liveOccupancy && <OccupancyDot occupancy={leg.liveOccupancy} />}
            </div>
          );
        })}

      </div>
    </motion.div>
  );
};

export default RouteCard;
