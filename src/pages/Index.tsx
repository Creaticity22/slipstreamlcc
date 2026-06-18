import { motion } from "framer-motion";
import JourneySearch from "@/components/JourneySearch";
import QuickActions from "@/components/QuickActions";
import FrequentJourneys from "@/components/FrequentJourneys";
import SponsoredRewardsRow from "@/components/SponsoredRewardsRow";
import ImpactCard from "@/components/ImpactCard";
import LiveNudge from "@/components/LiveNudge";
import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import BrandHeader from "@/components/BrandHeader";

const Index = () => {
  const { user } = useAuth();
  const firstName = user?.user_metadata?.full_name?.split(" ")[0] ||
                    user?.user_metadata?.name?.split(" ")[0] || null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader
          title={firstName ? `Hey ${firstName}! ` : "Welcome to Slipstream"}
          subtitle="Where are you heading today?"
          action={
            <button
              aria-label="Notifications"
              className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card"
            >
              <Bell className="w-5 h-5 text-foreground" />
            </button>
          }
        />

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

        {/* Impact card (real data from trips + profile) */}
        <ImpactCard />

        {/* Smart nudge (real live departure for top frequent journey, hidden if no data) */}
        <LiveNudge />
      </div>
    </div>
  );
};

export default Index;

