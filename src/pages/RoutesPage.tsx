import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import RouteCard from "@/components/RouteCard";

const mockRoutes = [
  {
    type: "fastest" as const,
    departureTime: "07:42",
    arrivalTime: "08:15",
    duration: "33 min",
    co2: "0.4 kg CO₂e",
    crowding: "High" as const,
    legs: [
      { mode: "bus" as const, line: "72", duration: "18 min" },
      { mode: "train" as const, line: "Northern", duration: "12 min" },
    ],
    delay: 2,
  },
  {
    type: "least-busy" as const,
    departureTime: "07:50",
    arrivalTime: "08:28",
    duration: "38 min",
    co2: "0.3 kg CO₂e",
    crowding: "Low" as const,
    legs: [
      { mode: "bus" as const, line: "X6", duration: "25 min" },
      { mode: "walk" as const, line: "Walk", duration: "8 min" },
    ],
  },
  {
    type: "lowest-carbon" as const,
    departureTime: "07:45",
    arrivalTime: "08:22",
    duration: "37 min",
    co2: "0.2 kg CO₂e",
    crowding: "Medium" as const,
    legs: [
      { mode: "bus" as const, line: "110", duration: "30 min" },
      { mode: "walk" as const, line: "Walk", duration: "5 min" },
    ],
  },
];

const RoutesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { from, to } = (location.state as { from?: string; to?: string }) || {};

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-4">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-5"
        >
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center shadow-card"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">
              {from || "Your location"} → {to || "Destination"}
            </p>
            <p className="text-xs text-muted-foreground">Today, leaving now</p>
          </div>
        </motion.div>

        <div className="space-y-3">
          {mockRoutes.map((route, i) => (
            <motion.div
              key={route.type}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <RouteCard {...route} />
            </motion.div>
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center text-xs text-muted-foreground mt-4"
        >
          Nice one—the green route saves 0.7 kg CO₂e 🌱
        </motion.p>
      </div>
    </div>
  );
};

export default RoutesPage;
