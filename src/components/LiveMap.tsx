import { useEffect, useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { fetchLiveDepartures, LiveDeparture } from "@/services/bodsService";
import { Bus, RefreshCw, WifiOff } from "lucide-react";
import { GeoPosition } from "@/hooks/useGeolocation";

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

function FitBounds({ departures, userLat, userLng }: { departures: LiveDeparture[]; userLat: number; userLng: number }) {
  const map = useMap();
  useEffect(() => {
    const points = departures
      .filter((d) => d.location)
      .map((d) => [d.location!.lat, d.location!.lng] as [number, number]);
    points.push([userLat, userLng]);
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    }
  }, [departures, map, userLat, userLng]);
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
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const refLat = userPosition?.lat ?? 53.825;
  const refLng = userPosition?.lng ?? -1.576;

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchLiveDepartures(undefined, bbox ?? undefined);
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
        </div>
        <button onClick={refresh} className="p-1 rounded-lg hover:bg-muted transition-colors" aria-label="Refresh">
          <RefreshCw className={`w-3.5 h-3.5 text-muted-foreground ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border shadow-card" style={{ height: "400px" }}>
        <MapContainer
          center={[refLat, refLng]}
          zoom={13}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%" }}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds departures={departures} userLat={refLat} userLng={refLng} />

          {/* User location marker */}
          <Marker
            position={[refLat, refLng]}
            icon={L.divIcon({
              className: "ref-marker",
              html: `<div style="
                width: 14px; height: 14px;
                background: hsl(162 72% 40%);
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [14, 14],
              iconAnchor: [7, 7],
            })}
          >
            <Popup>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 13 }}>
                📍 Your location
              </div>
            </Popup>
          </Marker>

          {departures.map((dep, i) =>
            dep.location ? (
              <Marker
                key={`${dep.vehicleRef}-${i}`}
                position={[dep.location.lat, dep.location.lng]}
                icon={createBusIcon(dep.lineName || dep.lineRef, dep.status)}
              >
                <Popup>
                  <div style={{ fontFamily: "'Space Grotesk', sans-serif", minWidth: 160 }}>
                    <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 4 }}>
                      🚌 {dep.lineName || dep.lineRef}
                    </div>
                    <div style={{ fontSize: 12, color: "#333", marginBottom: 2 }}>
                      → {formatDestination(dep.destination || "Unknown")}
                    </div>
                    <div style={{ fontSize: 11, color: "#666", marginBottom: 2 }}>
                      {haversineKm(refLat, refLng, dep.location.lat, dep.location.lng).toFixed(1)} km away
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: dep.status === "delayed" ? "#e8614d" : dep.status === "early" ? "#7c5cbf" : "#1aa876",
                      }}
                    >
                      {dep.status === "on-time" ? "On time" : dep.status === "delayed" ? "Delayed" : "Early"}
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          )}
        </MapContainer>
      </div>

      <p className="text-center text-[10px] text-muted-foreground">
        {lastUpdated
          ? `Updated at ${formatTime(lastUpdated)} · Source: data.bus-data.dft.gov.uk`
          : loading
          ? "Fetching live positions…"
          : "No data available"}
      </p>
    </div>
  );
};

export default LiveMap;
