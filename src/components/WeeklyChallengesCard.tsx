import { motion } from "framer-motion";
import { Bus, Sunrise, Map as MapIcon, Leaf, Flame, CheckCircle2, type LucideIcon } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { useAuth } from "@/hooks/useAuth";

const ICONS: Record<string, LucideIcon> = {
  Bus,
  Sunrise,
  Map: MapIcon,
  Leaf,
  Flame,
};

export default function WeeklyChallengesCard() {
  const { user } = useAuth();
  const { challenges, loading } = useWeeklyChallenges();

  if (!user) return null;
  if (loading && challenges.length === 0) {
    return <div className="mt-5 h-44 rounded-2xl bg-muted animate-pulse" />;
  }
  if (challenges.length === 0) return null;

  const allDone = challenges.every((c) => c.completed_at);

  return (
    <div className="mt-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-base font-display font-bold text-foreground">This week's challenges</h3>
        <span className="text-[11px] text-muted-foreground">
          {challenges.filter((c) => c.completed_at).length}/{challenges.length} done
        </span>
      </div>

      {allDone && (
        <p className="text-xs text-slipstream-teal font-medium mb-3">
          All challenges done this week — come back Monday for new ones 🎉
        </p>
      )}

      <div className="space-y-2.5">
        {challenges.map((c, i) => {
          const Icon = ICONS[c.definition.icon] ?? Bus;
          const pct = Math.min(100, Math.round((c.progress / c.target) * 100));
          const done = !!c.completed_at;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`rounded-2xl border p-3.5 bg-card ${
                done ? "border-slipstream-teal/40" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    done ? "bg-slipstream-teal/15" : "bg-primary/15"
                  }`}
                >
                  <Icon className={`w-5 h-5 ${done ? "text-slipstream-teal" : "text-primary"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-foreground truncate">
                      {c.definition.title}
                    </p>
                    {done ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slipstream-teal/15 text-slipstream-teal flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Done!
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slipstream-gold/15 text-slipstream-gold">
                        +{c.definition.pointsReward} pts
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{c.definition.description}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <Progress value={pct} className="h-1.5 flex-1" />
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {Math.min(c.progress, c.target)}/{c.target}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
