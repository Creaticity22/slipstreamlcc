import { MapPinned, MapOff, RefreshCw } from "lucide-react";
import type { NaptanStop } from "@/services/naptanService";

interface Props {
  stops: NaptanStop[];
  isStub: boolean;
  savedAt: number | null;
  reason?: string;
  onRetry?: () => void;
}

const formatRelative = (ts: number) => {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} day(s) ago`;
};

const MapFallback = ({ stops, isStub, savedAt, reason, onRetry }: Props) => {
  return (
    <div
      className="rounded-2xl overflow-hidden border border-border bg-muted/40 flex flex-col"
      style={{ height: "400px" }}
      role="region"
      aria-label="Map temporarily unavailable"
    >
      <div className="px-4 py-3 border-b border-border bg-background/60 flex items-start gap-3">
        <div className="mt-0.5 text-muted-foreground">
          <MapOff className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">Map temporarily unavailable</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {reason ?? "We couldn't load the live map right now."} Showing{" "}
            {isStub ? "a few well-known stops nearby" : `cached stops${savedAt ? ` from ${formatRelative(savedAt)}` : ""}`}{" "}
            so you're not stuck.
          </div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="text-xs px-2 py-1 rounded-lg border border-border hover:bg-muted transition-colors flex items-center gap-1"
            aria-label="Retry loading map"
          >
            <RefreshCw className="w-3 h-3" /> Retry
          </button>
        )}
      </div>

      <ul className="flex-1 overflow-y-auto divide-y divide-border">
        {stops.length === 0 && (
          <li className="px-4 py-6 text-center text-xs text-muted-foreground">
            No cached stops yet — try again when you have a connection.
          </li>
        )}
        {stops.map((stop) => (
          <li
            key={stop.atcoCode}
            className="px-4 py-3 flex items-center gap-3 hover:bg-muted/60 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <MapPinned className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-foreground truncate">
                {stop.commonName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {stop.indicator ? `${stop.indicator} · ` : ""}
                {stop.lat.toFixed(4)}, {stop.lng.toFixed(4)}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MapFallback;
