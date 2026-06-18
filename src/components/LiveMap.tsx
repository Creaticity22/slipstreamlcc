import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchLiveDepartures, LiveDeparture } from "@/services/bodsService";
import { fetchNearbyStops, NaptanStop, formatStopLabel } from "@/services/naptanService";
import { Bus, RefreshCw, WifiOff } from "lucide-react";
import { GeoPosition } from "@/hooks/useGeolocation";
import { getWalkingDirections, WalkingRoute, formatDistance, formatWalkTime } from "@/services/directionsService";
import { checkLeafletHealth } from "@/lib/leafletHealthCheck";
import { cacheStops, getCachedStops } from "@/lib/stopsCache";
import { MapErrorBoundary } from "@/components/MapErrorBoundary";
import MapFallback from "@/components/MapFallback";

const LEAFLET_HEALTH = checkLeafletHealth();
if (!LEAFLET_HEALTH.ok) {
  // Loud signal in dev console so version drift is obvious before the map mounts
  // eslint-disable-next-line no-console
  console.error("[LiveMap] Leaflet health check failed:", LEAFLET_HEALTH);
} else if (LEAFLET_HEALTH.warnings.length) {
  // eslint-disable-next-line no-console
  console.warn("[LiveMap] Leaflet health check warnings:", LEAFLET_HEALTH);
}

const POLL_INTERVAL_MS = 30_000;

interface Props {
  userPosition?: GeoPosition | null;
  bbox?: { minLat: number; maxLat: number; minLon: number; maxLon: number } | null;
}

function createBusIcon(line: string, status: string) {
  const color = status === "delayed" ? "#e8614d" : status === "early" ? "#7c5cbf" : "#1aa876";
  return L.divIcon({
    className: "bus-marker",
    html: `<div style="
      background: ${color};
      color: white;
      font-family: 'Space Grotesk', sans-serif;
      font-weight: 700;
      font-size: 11px;
      padding: 4px 8px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: 4px;
      border: 2px solid white;
    ">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/><path d="M15 6v6"/><path d="M2 12h19.6"/><path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/><path d="M9 18h5"/><circle cx="16" cy="18" r="2"/>
      </svg>
      ${line}
    </div>`,
    iconSize: [0, 0],
    iconAnchor: [20, 15],
    popupAnchor: [0, -15],
  });
}

function createStopIcon() {
  return L.divIcon({
    className: "stop-marker",
    html: `<div style="
      width: 10px; height: 10px;
      background: hsl(270 60% 55%);
      border: 2px solid white;
      border-radius: 50%;
      box-shadow: 0 1px 4px rgba(0,0,0,0.3);
    "></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5],
    popupAnchor: [0, -8],
  });
}

function FitBounds({ departures, userLat, userLng, walkingRoute }: { departures: LiveDeparture[]; userLat: number; userLng: number; walkingRoute: WalkingRoute | null }) {
  const map = useMap();
  useEffect(() => {
    if (walkingRoute && walkingRoute.geometry.length > 0) {
      const bounds = L.latLngBounds(walkingRoute.geometry);
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 17 });
      return;
    }
    const points = departures
      .filter((d) => d.location)
      .map((d) => [d.location!.lat, d.location!.lng] as [number, number]);
    points.push([userLat, userLng]);
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [departures, map, userLat, userLng, walkingRoute]);
  return null;
}

function formatDestination(raw: string): string {
  return raw.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const LiveMap = ({ userPosition, bbox }: Props) => {
  const [departures, setDepartures] = useState<LiveDeparture[]>([]);
  const [nearbyStops, setNearbyStops] = useState<NaptanStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [walkingRoute, setWalkingRoute] = useState<WalkingRoute | null>(null);
  const [walkingTarget, setWalkingTarget] = useState<string | null>(null);

  const refLat = userPosition?.lat ?? 53.825;
  const refLng = userPosition?.lng ?? -1.576;

  // Fetch nearby NaPTAN stops (and persist for offline fallback)
  useEffect(() => {
    if (!userPosition) return;
    fetchNearbyStops(userPosition.lat, userPosition.lng, 1).then(res => {
      if (res.stops.length > 0) {
        setNearbyStops(res.stops);
        cacheStops(res.stops, userPosition.lat, userPosition.lng);
      }
    }).catch(() => {
      // network failed — fallback will pick up cached/stub stops
    });
  }, [userPosition?.lat, userPosition?.lng]);

  const refresh = useCallback(async () => {
    if (!bbox) return;
    setLoading(true);
    try {
      const result = await fetchLiveDepartures(undefined, bbox);
      if (result.source !== "error" && result.departures.length > 0) {
        setDepartures(result.departures.filter((d) => d.location));
        setIsLive(true);
        setLastUpdated(new Date(result.updatedAt));
      } else {
        setDepartures([]);
        setIsLive(false);
      }
    } catch {
      setDepartures([]);
      setIsLive(false);
    } finally {
      setLoading(false);
    }
  }, [bbox]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const handleWalkToStop = async (stop: NaptanStop) => {
    if (!userPosition) return;
    const key = stop.atcoCode;
    if (walkingTarget === key) {
      setWalkingRoute(null);
      setWalkingTarget(null);
      return;
    }
    setWalkingTarget(key);
    const route = await getWalkingDirections(userPosition, stop.lat, stop.lng);
    setWalkingRoute(route);
  };

  const formatTime = (d: Date) =>
    d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isLive ? (
            <span className="text-xs font-semibold text-slipstream-teal flex items-center gap-1">
              <span className="animate-pulse-soft">●</span> {departures.length} bus{departures.length !== 1 ? "es" : ""} tracked
            </span>
          ) : loading ? (
            <span className="text-xs text-muted-foreground">Loading map…</span>
          ) : (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <WifiOff className="w-3 h-3" /> No live data
            </span>
          )}
          {nearbyStops.length > 0 && (
            <span className="text-xs text-muted-foreground">
              · 🚏 {nearbyStops.length} stops
            </span>
          )}
          {walkingRoute && (
            <span className="text-xs text-primary font-medium">
              🚶 {formatWalkTime(walkingRoute.totalDuration)} · {formatDistance(walkingRoute.totalDistance)}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {walkingRoute && (
            <button
              onClick={() => { setWalkingRoute(null); setWalkingTarget(null); }}
              className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-lg hover:bg-muted transition-colors"
            >
              Clear route
            </button>
          )}
          <button onClick={refresh} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Refresh">
            <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {LEAFLET_HEALTH.ok ? (
        <MapErrorBoundary
          fallback={(err) => {
            const cached = getCachedStops();
            return (
              <MapFallback
                stops={cached.stops}
                isStub={cached.isStub}
                savedAt={cached.savedAt}
                reason={`Map provider error: ${err.message}`}
                onRetry={() => window.location.reload()}
              />
            );
          }}
        >
          <div className="rounded-2xl overflow-hidden border border-border shadow-card" style={{ height: "400px" }}>
            <MapContainer
              center={[refLat, refLng]}
              zoom={13}
              scrollWheelZoom={true}
              style={{ height: "100%", width: "100%" }}
              zoomControl={false}
            >
{/* keep existing code (TileLayer, FitBounds, walking polyline, NaPTAN markers, bus markers, user circle) */}
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <FitBounds departures={departures} userLat={refLat} userLng={refLng} walkingRoute={walkingRoute} />

              {/* Walking route polyline */}
              {walkingRoute && walkingRoute.geometry.length > 0 && (
                <Polyline
                  positions={walkingRoute.geometry}
                  pathOptions={{
                    color: "#1aa876",
                    weight: 4,
                    opacity: 0.8,
                    dashArray: "8, 12",
                    lineCap: "round",
                  }}
                />
              )}

              {/* NaPTAN bus stop markers */}
              {nearbyStops.map(stop => (
                <Marker
                  key={stop.atcoCode}
                  position={[stop.lat, stop.lng]}
                  icon={createStopIcon()}
                  eventHandlers={{ click: () => handleWalkToStop(stop) }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold">{formatStopLabel(stop)}</div>
                      <button
                        onClick={() => handleWalkToStop(stop)}
                        className="mt-1 text-primary underline"
                      >
                        {walkingTarget === stop.atcoCode ? "Hide route" : "Walk here"}
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Bus markers */}
              {departures.map((dep, idx) =>
                dep.location ? (
                  <Marker
                    key={dep.vehicleRef || `${dep.lineRef}-${idx}`}
                    position={[dep.location.lat, dep.location.lng]}
                    icon={createBusIcon(dep.lineName || dep.lineRef, dep.status)}
                  >
                    <Popup>
                      <div className="text-xs space-y-1">
                        <div className="font-semibold flex items-center gap-1">
                          <Bus className="w-3 h-3" /> Line {dep.lineName || dep.lineRef}
                        </div>
                        <div>{dep.destination}</div>
                        <div className="text-muted-foreground">
                          ETA: {dep.minutesAway ?? "—"}m
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ) : null
              )}

              {/* User position */}
              {userPosition && (
                <CircleMarker
                  center={[userPosition.lat, userPosition.lng]}
                  radius={8}
                  pathOptions={{ color: "#2D7DD2", fillColor: "#2D7DD2", fillOpacity: 0.6, weight: 2 }}
                >
                  <Popup>You are here</Popup>
                </CircleMarker>
              )}
            </MapContainer>
          </div>
        </MapErrorBoundary>
      ) : (
        (() => {
          const cached = getCachedStops();
          return (
            <MapFallback
              stops={cached.stops}
              isStub={cached.isStub}
              savedAt={cached.savedAt}
              reason="The map library is unavailable in this environment."
            />
          );
        })()
      )}

      <p className="text-center text-[10px] text-muted-foreground">
        {lastUpdated
          ? `Updated at ${formatTime(lastUpdated)} · BODS + NaPTAN`
          : loading
          ? "Fetching live positions…"
          : "No data available"}
      </p>
    </div>
  );
};

export default LiveMap;
