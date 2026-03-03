import { motion } from "framer-motion";
import { Trophy, Flame, Leaf, Zap } from "lucide-react";

const badges = [
  { name: "Carbon Saver", emoji: "🌱", earned: true, color: "bg-slipstream-teal/15 text-slipstream-teal" },
  { name: "Off-Peak Pro", emoji: "😎", earned: true, color: "bg-slipstream-purple/15 text-slipstream-purple" },
  { name: "Interchange Ace", emoji: "🚀", earned: false, color: "bg-muted text-muted-foreground" },
  { name: "Streak Master", emoji: "🔥", earned: false, color: "bg-muted text-muted-foreground" },
];

const PointsSummary = () => {
  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-dark rounded-2xl p-5 text-primary-foreground"
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slipstream-gold" />
            <span className="text-sm font-medium opacity-80">Slipstream Points</span>
          </div>
          <span className="text-xs font-medium bg-primary-foreground/15 px-2 py-1 rounded-full">Level 3</span>
        </div>
        <p className="text-4xl font-display font-bold">1,247</p>
        <div className="flex gap-4 mt-3">
          <div className="flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-slipstream-coral" />
            <span className="text-xs opacity-80">5 day streak</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Leaf className="w-4 h-4 text-slipstream-lime" />
            <span className="text-xs opacity-80">4.2 kg CO₂ saved</span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex justify-between text-xs mb-1 opacity-70">
            <span>Next level: 1,500</span>
            <span>253 to go</span>
          </div>
          <div className="h-2 bg-primary-foreground/15 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "83%" }}
              transition={{ delay: 0.3, duration: 0.8, ease: "easeOut" }}
              className="h-full bg-gradient-warm rounded-full"
            />
          </div>
        </div>
      </motion.div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Badges</p>
        <div className="grid grid-cols-2 gap-2">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.name}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className={`${badge.color} rounded-xl p-3 flex items-center gap-2.5 ${!badge.earned ? "opacity-50" : ""}`}
            >
              <span className="text-2xl">{badge.emoji}</span>
              <div>
                <p className="text-sm font-semibold">{badge.name}</p>
                <p className="text-[10px] opacity-70">{badge.earned ? "Earned" : "Keep going!"}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">Recent activity</p>
        <div className="space-y-2">
          {[
            { text: "Low-carbon route to college", pts: "+15", icon: Leaf, time: "Today 8:12 AM" },
            { text: "Off-peak journey bonus", pts: "+10", icon: Zap, time: "Yesterday 10:30 AM" },
            { text: "5-day streak bonus!", pts: "+50", icon: Flame, time: "Yesterday" },
          ].map((item, i) => (
            <div key={i} className="bg-card rounded-xl p-3 flex items-center gap-3 border border-border">
              <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center">
                <item.icon className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{item.text}</p>
                <p className="text-[11px] text-muted-foreground">{item.time}</p>
              </div>
              <span className="text-sm font-bold text-slipstream-teal">{item.pts}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PointsSummary;
