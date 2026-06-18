import { useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { fetchNearbyStops, type NaptanStop } from "@/services/naptanService";

interface Props {
  onSelect: (stopName: string) => void;
}

export default function NearbyStopsRow({ onSelect }: Props) {
  const { position, error: geoError } = useGeolocation();
  const [stops, setStops] = useState<NaptanStop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!position || geoError) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    fetchNearbyStops(position.lat, position.lng, 1).then((res) => {
      if (cancelled) return;
      setStops(res.stops.slice(0, 5));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [position, geoError]);

  if (geoError && !position) return null;
  if (!loading && stops.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
        Stops near you
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="shrink-0 w-32 h-14 rounded-xl bg-muted animate-pulse-soft"
              />
            ))
          : stops.map((s) => (
              <button
                key={s.atcoCode}
                onClick={() => onSelect(s.name)}
                className="shrink-0 bg-card rounded-xl px-3 py-2 text-left shadow-card border border-border"
              >
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3 h-3 text-primary" />
                  <span className="text-xs font-semibold whitespace-nowrap">
                    {s.name}
                  </span>
                </div>
                <span className="text-[10px] text-muted-foreground">
                  {(s.distanceKm * 1000).toFixed(0)}m away
                </span>
              </button>
            ))}
      </div>
    </div>
  );
}
