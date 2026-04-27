import { motion } from "framer-motion";
import LearnHub from "@/components/LearnHub";
import Logo from "@/components/Logo";

const LearnPage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4">
          <Logo size={30} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mb-5">
          <h1 className="text-2xl font-display font-bold text-foreground">Learn with Slipstream</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Quick guides to travel smarter</p>
        </motion.div>

        <LearnHub />
      </div>
    </div>);

};

export default LearnPage;