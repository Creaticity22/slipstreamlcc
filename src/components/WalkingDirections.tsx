import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Navigation, Footprints, ChevronDown, ChevronUp, X, Loader2 } from "lucide-react";
import { WalkingRoute, formatDistance, formatWalkTime } from "@/services/directionsService";

interface Props {
  route: WalkingRoute | null;
  loading: boolean;
  stopName: string;
  onClose: () => void;
}

const maneuverIcon: Record<string, string> = {
  "turn-left": "↰",
  "turn-right": "↱",
  "turn-slight-left": "↖",
  "turn-slight-right": "↗",
  depart: "🚶",
  arrive: "📍",
  straight: "↑",
  roundabout: "↻",
};

const WalkingDirections = ({ route, loading, stopName, onClose }: Props) => {
  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-card rounded-2xl border border-border shadow-card p-4 flex items-center gap-3"
      >
        <Loader2 className="w-5 h-5 text-primary animate-spin" />
        <span className="text-sm text-muted-foreground">Getting walking directions…</span>
      </motion.div>
    );
  }

  if (!route) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="bg-card rounded-2xl border border-primary/20 shadow-card overflow-hidden"
    >
      {/* Header */}
      <div className="bg-gradient-primary px-4 py-3 flex items-center gap-2">
        <Footprints className="w-4 h-4 text-primary-foreground" />
        <div className="flex-1">
          <span className="text-sm font-semibold text-primary-foreground">
            Walk to {stopName}
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-xs text-primary-foreground/80">
              {formatWalkTime(route.totalDuration)} · {formatDistance(route.totalDistance)}
            </span>
          </div>
        </div>
        <button
          onClick={() => setExpanded(!expanded)}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label={expanded ? "Collapse" : "Expand"}
        >
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-primary-foreground" />
          ) : (
            <ChevronDown className="w-4 h-4 text-primary-foreground" />
          )}
        </button>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Close"
        >
          <X className="w-4 h-4 text-primary-foreground" />
        </button>
      </div>

      {/* Steps */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-border">
              {route.steps
                .filter((s) => s.maneuver !== "arrive" || route.steps.indexOf(s) === route.steps.length - 1)
                .map((step, i) => (
                  <div key={i} className="px-4 py-3 flex items-start gap-3">
                    <span className="text-lg mt-0.5 w-6 text-center shrink-0">
                      {maneuverIcon[step.maneuver] || "→"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground">{step.instruction}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDistance(step.distance)} · {formatWalkTime(step.duration)}
                      </p>
                    </div>
                  </div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick summary when collapsed */}
      {!expanded && route.steps.length > 0 && (
        <div className="px-4 py-2.5 flex items-center gap-2 text-xs text-muted-foreground">
          <Navigation className="w-3 h-3 text-primary" />
          <span>{route.steps[0]?.instruction}</span>
          <span className="text-muted-foreground/50">· tap to see all steps</span>
        </div>
      )}
    </motion.div>
  );
};

export default WalkingDirections;
