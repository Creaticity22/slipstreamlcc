import { motion } from "framer-motion";
import { Bus, Train, AlertTriangle, Clock } from "lucide-react";

const departures = [
  { mode: "bus" as const, line: "72", destination: "Leeds City Centre", time: "3 min", status: "on-time" as const, crowding: "Low" },
  { mode: "bus" as const, line: "X6", destination: "Bradford Interchange", time: "7 min", status: "on-time" as const, crowding: "Medium" },
  { mode: "train" as const, line: "Northern", destination: "Huddersfield", time: "12 min", status: "delayed" as const, crowding: "High" },
  { mode: "bus" as const, line: "110", destination: "Wakefield", time: "15 min", status: "on-time" as const, crowding: "Low" },
  { mode: "train" as const, line: "TPE", destination: "Manchester Piccadilly", time: "18 min", status: "on-time" as const, crowding: "Medium" },
];

const statusBadge = {
  "on-time": "bg-slipstream-teal/15 text-slipstream-teal",
  delayed: "bg-slipstream-coral/15 text-slipstream-coral",
};

const crowdingDots: Record<string, number> = { Low: 1, Medium: 2, High: 3 };

const LiveDepartures = () => {
  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl shadow-card overflow-hidden border border-border">
        <div className="bg-gradient-primary px-4 py-3 flex items-center gap-2">
          <Clock className="w-4 h-4 text-primary-foreground" />
          <span className="text-sm font-semibold text-primary-foreground">Live departures near you</span>
          <span className="ml-auto text-[10px] text-primary-foreground/70 animate-pulse-soft">● Live</span>
        </div>

        <div className="divide-y divide-border">
          {departures.map((dep, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              className="px-4 py-3 flex items-center gap-3"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${dep.mode === "bus" ? "bg-slipstream-coral/15" : "bg-slipstream-purple/15"}`}>
                {dep.mode === "bus" ? (
                  <Bus className="w-4 h-4 text-slipstream-coral" />
                ) : (
                  <Train className="w-4 h-4 text-slipstream-purple" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-foreground">{dep.line}</span>
                  <span className="text-sm text-foreground truncate">{dep.destination}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${statusBadge[dep.status]}`}>
                    {dep.status === "delayed" && <AlertTriangle className="w-2.5 h-2.5 inline mr-0.5" />}
                    {dep.status === "on-time" ? "On time" : "Delayed"}
                  </span>
                  <div className="flex gap-0.5">
                    {Array.from({ length: 3 }).map((_, j) => (
                      <div
                        key={j}
                        className={`w-1.5 h-1.5 rounded-full ${j < crowdingDots[dep.crowding] ? "bg-slipstream-coral" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <span className="text-lg font-display font-bold text-foreground whitespace-nowrap">{dep.time}</span>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-slipstream-gold/10 border border-slipstream-gold/30 rounded-xl p-3 flex items-start gap-2.5">
        <AlertTriangle className="w-4 h-4 text-slipstream-gold mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-semibold text-foreground">Heads up!</p>
          <p className="text-xs text-muted-foreground mt-0.5">Northern line to Huddersfield running ~5 mins late. Fancy a calmer 7:50 bus instead? 😊</p>
        </div>
      </div>
    </div>
  );
};

export default LiveDepartures;
