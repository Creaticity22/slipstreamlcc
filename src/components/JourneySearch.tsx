import { useState, useEffect } from "react";
import { MapPin, ArrowRight, Navigation, Locate, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useFrequentJourneys } from "@/hooks/useFrequentJourneys";
import { usePreferences } from "@/hooks/usePreferences";

interface JourneySearchProps {
  externalFrom?: string;
}

const JourneySearch = ({ externalFrom }: JourneySearchProps = {}) => {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const navigate = useNavigate();
  const geo = useGeolocation();
  const { logJourney } = useFrequentJourneys();
  const { prefs } = usePreferences();

  // Pre-fill "To" from saved home_destination
  useEffect(() => {
    if (prefs?.home_destination && !to) {
      setTo(prefs.home_destination);
    }
  }, [prefs?.home_destination]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync "From" from parent (e.g. nearby-stop chip taps)
  useEffect(() => {
    if (externalFrom) setFrom(externalFrom);
  }, [externalFrom]);

  const handleSearch = () => {
    if (from && to) {
      logJourney(from, to);
      navigate("/routes", {
        state: {
          from,
          to,
          userLat: geo.position?.lat,
          userLng: geo.position?.lng,
        },
      });
    }
  };

  const handleUseMyLocation = () => {
    if (geo.loading) return;
    if (geo.position) {
      setFrom(`📍 My location (${geo.position.lat.toFixed(3)}, ${geo.position.lng.toFixed(3)})`);
    } else {
      geo.refresh();
    }
  };

  const quickDestinations = [
    { name: "Leeds City College", emoji: "🎓" },
    { name: "Bradford Interchange", emoji: "🚉" },
    { name: "Huddersfield Station", emoji: "🚂" },
    { name: "Wakefield Bus Stn", emoji: "🚌" },
  ];

  return (
    <div className="space-y-4">
      <div className="bg-card rounded-2xl shadow-card p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
            <Navigation className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Where from?"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full bg-muted rounded-xl px-4 py-3 pr-10 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <button
              onClick={handleUseMyLocation}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg hover:bg-background/50 transition-colors"
              aria-label="Use my location"
              title="Use my location"
            >
              {geo.loading ? (
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              ) : (
                <Locate className="w-4 h-4 text-primary" />
              )}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-warm flex items-center justify-center shrink-0">
            <MapPin className="w-5 h-5 text-secondary-foreground" />
          </div>
          <input
            type="text"
            placeholder="Where to?"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="flex-1 bg-muted rounded-xl px-4 py-3 text-sm font-medium text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleSearch}
          className="w-full bg-gradient-primary text-primary-foreground font-display font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 text-base"
        >
          Find my route <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>

      <div>
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
          Quick picks
        </p>
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {quickDestinations.map((dest) => (
            <motion.button
              key={dest.name}
              whileTap={{ scale: 0.95 }}
              onClick={() => setTo(dest.name)}
              className="shrink-0 bg-card rounded-xl px-4 py-2.5 text-sm font-medium text-foreground shadow-card flex items-center gap-2 border border-border"
            >
              <span>{dest.emoji}</span>
              <span className="whitespace-nowrap">{dest.name}</span>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default JourneySearch;
