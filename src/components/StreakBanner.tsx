import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { useStreak } from "@/hooks/useStreak";
import { useAuth } from "@/hooks/useAuth";

export default function StreakBanner() {
  const { user } = useAuth();
  const { currentStreak, longestStreak } = useStreak();

  if (!user) return null;

  const isGlow = currentStreak >= 7;
  const isZero = currentStreak === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`mt-3 rounded-2xl p-4 border border-border bg-card flex items-center gap-3 ${
        isGlow ? "shadow-[0_0_12px_rgba(251,191,36,0.5)]" : "shadow-card"
      }`}
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isGlow ? "bg-slipstream-gold/20" : "bg-slipstream-coral/15"
        }`}
      >
        <Flame
          className={`w-6 h-6 ${isGlow ? "text-slipstream-gold" : "text-slipstream-coral"}`}
          strokeWidth={2.4}
        />
      </div>
      <div className="flex-1 min-w-0">
        {isZero ? (
          <p className="text-sm font-semibold text-foreground">Start your streak today 🚌</p>
        ) : (
          <p className="text-sm font-semibold text-foreground">
            {currentStreak} day streak
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          {isZero
            ? "Travel today to begin a fresh run"
            : `Longest: ${Math.max(longestStreak, currentStreak)} days`}
        </p>
      </div>
    </motion.div>
  );
}
