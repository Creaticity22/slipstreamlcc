import { motion } from "framer-motion";
import LiveDepartures from "@/components/LiveDepartures";
import { MapPin } from "lucide-react";

const LivePage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-display font-bold text-foreground">Live updates ⏱️</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm text-muted-foreground">Near Headingley Lane</p>
          </div>
        </motion.div>

        <LiveDepartures />
      </div>
    </div>
  );
};

export default LivePage;
