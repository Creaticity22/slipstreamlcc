import { motion } from "framer-motion";
import { Clock, Users, Leaf, Train, Bus, ArrowRight } from "lucide-react";

type RouteType = "fastest" | "least-busy" | "lowest-carbon";

interface RouteCardProps {
  type: RouteType;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  co2: string;
  crowding: "Low" | "Medium" | "High";
  legs: { mode: "bus" | "train" | "walk"; line: string; duration: string }[];
  delay?: number;
}

const typeConfig: Record<RouteType, { label: string; icon: typeof Clock; gradient: string; emoji: string }> = {
  fastest: { label: "Fastest", icon: Clock, gradient: "bg-gradient-primary", emoji: "⚡" },
  "least-busy": { label: "Least busy", icon: Users, gradient: "bg-gradient-cool", emoji: "😌" },
  "lowest-carbon": { label: "Lowest carbon", icon: Leaf, gradient: "bg-gradient-warm", emoji: "🌱" },
};

const crowdingColor: Record<string, string> = {
  Low: "text-slipstream-teal",
  Medium: "text-slipstream-gold",
  High: "text-slipstream-coral",
};

const RouteCard = ({ type, departureTime, arrivalTime, duration, co2, crowding, legs, delay }: RouteCardProps) => {
  const config = typeConfig[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      className="bg-card rounded-2xl shadow-card p-4 space-y-3 cursor-pointer border border-border hover:shadow-elevated transition-shadow"
    >
      <div className="flex items-center justify-between">
        <span className={`${config.gradient} text-primary-foreground text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5`}>
          {config.emoji} {config.label}
        </span>
        <span className="text-xs font-medium text-muted-foreground">{duration}</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl font-display font-bold text-foreground">{departureTime}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="text-2xl font-display font-bold text-foreground">{arrivalTime}</span>
        {delay && delay > 0 && (
          <span className="text-xs font-semibold text-slipstream-coral bg-slipstream-coral/10 px-2 py-0.5 rounded-full">
            +{delay} min
          </span>
        )}
      </div>

      <div className="flex gap-1.5 items-center">
        {legs.map((leg, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && <div className="w-1 h-1 rounded-full bg-muted-foreground/40" />}
            <div className="flex items-center gap-1 bg-muted rounded-lg px-2.5 py-1">
              {leg.mode === "bus" ? (
                <Bus className="w-3.5 h-3.5 text-slipstream-coral" />
              ) : leg.mode === "train" ? (
                <Train className="w-3.5 h-3.5 text-slipstream-purple" />
              ) : null}
              <span className="text-xs font-semibold text-foreground">{leg.line}</span>
              <span className="text-[10px] text-muted-foreground">{leg.duration}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4 pt-1 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Leaf className="w-3.5 h-3.5 text-slipstream-teal" />
          <span className="text-xs font-medium text-foreground">{co2}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5" />
          <span className={`text-xs font-semibold ${crowdingColor[crowding]}`}>{crowding}</span>
        </div>
      </div>
    </motion.div>
  );
};

export default RouteCard;
