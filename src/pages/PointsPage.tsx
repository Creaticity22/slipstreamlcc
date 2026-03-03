import { motion } from "framer-motion";
import PointsSummary from "@/components/PointsSummary";

const PointsPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-display font-bold text-foreground">Your points 🏆</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Keep riding green to level up!</p>
        </motion.div>

        <PointsSummary />
      </div>
    </div>
  );
};

export default PointsPage;
