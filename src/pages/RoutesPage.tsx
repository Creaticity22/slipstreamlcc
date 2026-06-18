import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  RefreshCw,
  AlertCircle,
  Accessibility,
  Bookmark,
  BookmarkCheck,
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import RouteCard from "@/components/RouteCard";
import { planJourney, type JourneyOption } from "@/services/journeyPlannerService";
import { useGeolocation } from "@/hooks/useGeolocation";
import { useLiveBusOverlay } from "@/hooks/useLiveBusOverlay";
import { useSavedRoutes } from "@/hooks/useSavedRoutes";


const RoutesPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    from,
    to,
    fromCoords,
    toCoords,
    stepFree,
  } = (location.state as {
    from?: string;
    to?: string;
    fromCoords?: { lat: number; lng: number };
    toCoords?: { lat: number; lng: number };
    stepFree?: boolean;
  }) || {};

  const fromLabel = from || "Your location";
  const toLabel = to || "Destination";

  const [loading, setLoading] = useState(true);
  const [options, setOptions] = useState<JourneyOption[]>([]);
  const [error, setError] = useState<string | null>(null);
  const geo = useGeolocation();
  const bbox = geo.toBbox(10);
  const overlaidOptions = useLiveBusOverlay(options, bbox);

  const { savedRoutes, saveRoute, deleteRoute } = useSavedRoutes();
  const existingSaved = useMemo(() => {
    if (!from || !to) return null;
    return (
      savedRoutes.find(
        (r) =>
          r.from_place.toLowerCase() === from.toLowerCase() &&
          r.to_place.toLowerCase() === to.toLowerCase()
      ) || null
    );
  }, [savedRoutes, from, to]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [saveLabel, setSaveLabel] = useState("");

  useEffect(() => {
    setSaveLabel(`${fromLabel} → ${toLabel}`);
  }, [fromLabel, toLabel]);

  const search = useCallback(async () => {
    if (!from || !to) {
      setLoading(false);
      setError("Please enter a start and destination");
      return;
    }
    setLoading(true);
    setError(null);
    const result = await planJourney(from, to, fromCoords, toCoords, stepFree);
    setOptions(result.options);
    setError(result.source === "error" ? result.error ?? "No routes found" : null);
    setLoading(false);
  }, [from, to, fromCoords, toCoords, stepFree]);

  useEffect(() => {
    search();
  }, [search]);

  const handleToggleSave = async () => {
    if (existingSaved) {
      await deleteRoute(existingSaved.id);
      toast("Saved route removed");
      return;
    }
    setShowSaveForm((v) => !v);
  };

  const handleSave = async () => {
    if (!from || !to) return;
    const res = await saveRoute(
      saveLabel.trim() || `${fromLabel} → ${toLabel}`,
      from,
      to,
      fromCoords,
      toCoords
    );
    if (res) {
      toast.success("Route saved ✓");
      setShowSaveForm(false);
    } else {
      toast.error("Couldn't save route. Sign in first.");
    }
  };

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
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="text-sm font-semibold text-foreground truncate">
                {fromLabel} → {toLabel}
              </p>
              {stepFree && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 flex items-center gap-1">
                  <Accessibility className="w-3 h-3" /> Step-free
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              {loading ? "Searching…" : options.length > 0 ? `${options.length} options` : "No options"}
            </p>
          </div>
          <button
            onClick={search}
            disabled={loading}
            className="p-1.5"
            aria-label="Search again"
          >
            <RefreshCw className={`w-4 h-4 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </motion.div>

        {!loading && options.length > 0 && from && to && (
          <div className="mb-3">
            <button
              onClick={handleToggleSave}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition-colors ${
                existingSaved
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "bg-card text-foreground border-border"
              }`}
            >
              {existingSaved ? (
                <>
                  <BookmarkCheck className="w-3.5 h-3.5" /> Saved
                </>
              ) : (
                <>
                  <Bookmark className="w-3.5 h-3.5" /> Save this route
                </>
              )}
            </button>
            <AnimatePresence>
              {showSaveForm && !existingSaved && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 bg-card border border-border rounded-xl p-3 flex gap-2 items-center">
                    <input
                      value={saveLabel}
                      onChange={(e) => setSaveLabel(e.target.value)}
                      className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                      placeholder="Label this route"
                      aria-label="Saved route label"
                    />
                    <button
                      onClick={handleSave}
                      className="bg-gradient-primary text-primary-foreground text-sm font-semibold px-4 py-2 rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {loading && (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground text-center">Finding your routes…</p>
            {[0, 1, 2].map((i) => (
              <div key={i} className="rounded-2xl bg-muted animate-pulse h-32" />
            ))}
          </div>
        )}

        {!loading && options.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-card border border-border rounded-2xl p-5 text-center space-y-3"
          >
            <AlertCircle className="w-8 h-8 text-muted-foreground mx-auto" />
            <div>
              <p className="text-sm font-semibold text-foreground">No routes found</p>
              <p className="text-xs text-muted-foreground mt-1 break-all">
                {error || "We couldn't find a route between these places."}
              </p>
            </div>
            <button
              onClick={search}
              className="bg-gradient-primary text-primary-foreground font-semibold text-sm px-4 py-2 rounded-xl"
            >
              Try again
            </button>
          </motion.div>
        )}

        {!loading && options.length > 0 && (
          <div className="space-y-3">
            {overlaidOptions.map((opt, i) => (
              <motion.div
                key={`${opt.type}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <RouteCard {...opt} />
              </motion.div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground text-center mt-5">
          Journey times from TransportAPI · Live tracking from BODS
        </p>
      </div>
    </div>
  );
};

export default RoutesPage;
