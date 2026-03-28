import { useState, useEffect, useCallback } from "react";

export interface GeoPosition {
  lat: number;
  lng: number;
  accuracy: number;
}

export interface UseGeolocationResult {
  position: GeoPosition | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
  /** Build a bounding box around the position (default ~10km radius) */
  toBbox: (radiusKm?: number) => {
    minLat: number;
    maxLat: number;
    minLon: number;
    maxLon: number;
  } | null;
}

const FALLBACK: GeoPosition = { lat: 53.825, lng: -1.576, accuracy: 0 }; // Headingley

export function useGeolocation(watch = false): UseGeolocationResult {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleSuccess = useCallback((pos: GeolocationPosition) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
    });
    setLoading(false);
    setError(null);
  }, []);

  const handleError = useCallback((err: GeolocationPositionError) => {
    console.warn("Geolocation error:", err.message);
    setPosition(FALLBACK);
    setError(err.message);
    setLoading(false);
  }, []);

  const refresh = useCallback(() => {
    if (!navigator.geolocation) {
      setPosition(FALLBACK);
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }
    setLoading(true);
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    });
  }, [handleSuccess, handleError]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setPosition(FALLBACK);
      setError("Geolocation not supported");
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 30000,
    });

    if (watch) {
      const id = navigator.geolocation.watchPosition(handleSuccess, handleError, {
        enableHighAccuracy: false,
        maximumAge: 60000,
      });
      return () => navigator.geolocation.clearWatch(id);
    }
  }, [watch, handleSuccess, handleError]);

  const toBbox = useCallback(
    (radiusKm = 10) => {
      if (!position) return null;
      const dLat = radiusKm / 111;
      const dLon = radiusKm / (111 * Math.cos((position.lat * Math.PI) / 180));
      return {
        minLat: position.lat - dLat,
        maxLat: position.lat + dLat,
        minLon: position.lng - dLon,
        maxLon: position.lng + dLon,
      };
    },
    [position]
  );

  return { position, loading, error, refresh, toBbox };
}
