import { motion } from "framer-motion";
import JourneySearch from "@/components/JourneySearch";
import QuickActions from "@/components/QuickActions";
import FrequentJourneys from "@/components/FrequentJourneys";
import SponsoredRewardsRow from "@/components/SponsoredRewardsRow";
import { Leaf, Zap, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const Index = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] || 
                    user?.user_metadata?.name?.split(" ")[0] || null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">
              {firstName ? `Hey ${firstName}! ` : "Welcome to Slipstream"}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Where are you heading today?
            </p>
          </div>
          <button className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card">
            <Bell className="w-5 h-5 text-foreground" />
          </button>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <JourneySearch />
        </motion.div>

        {/* Frequently used journeys (auto-tracked) */}
        <FrequentJourneys />

        {/* Quick actions: safety, help now, glossary, start trip */}
        <QuickActions />

        {/* Sponsored rewards — additive, scrolls naturally, never blocks core content */}
        <SponsoredRewardsRow placement="home" title="Opportunities for you" limit={1} />
        {/* Impact card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="mt-5 bg-gradient-primary rounded-2xl p-4 text-primary-foreground"
        >
          <div className="flex items-center gap-2 mb-2">
            <Leaf className="w-4 h-4" />
            <span className="text-xs font-semibold opacity-80">Your impact this week</span>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-display font-bold">2.1 kg</p>
              <p className="text-xs opacity-70">CO₂ saved</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">7</p>
              <p className="text-xs opacity-70">green trips</p>
            </div>
            <div>
              <p className="text-2xl font-display font-bold">85</p>
              <p className="text-xs opacity-70">points earned</p>
            </div>
          </div>
        </motion.div>

        {/* Smart nudge */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="mt-4 bg-card rounded-xl p-3.5 border border-border shadow-card flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-xl bg-slipstream-gold/15 flex items-center justify-center shrink-0">
            <Zap className="w-5 h-5 text-slipstream-gold" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-foreground">Leave in 8 minutes</p>
            <p className="text-xs text-muted-foreground">72 bus to Leeds is on time. Walk to Headingley Lane stop 🚶‍♂️</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Index;
