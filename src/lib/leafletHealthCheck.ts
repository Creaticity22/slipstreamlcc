import React from "react";
import * as ReactLeaflet from "react-leaflet";

// Versions are injected at build time by Vite's define plugin.
// Falls back to safe defaults if unavailable so the check still runs.
declare const __REACT_VERSION__: string | undefined;
declare const __REACT_LEAFLET_VERSION__: string | undefined;

const reactLeafletPkg = {
  version:
    typeof __REACT_LEAFLET_VERSION__ !== "undefined"
      ? __REACT_LEAFLET_VERSION__
      : "unknown",
};
const reactPkg = {
  version:
    typeof __REACT_VERSION__ !== "undefined"
      ? __REACT_VERSION__
      : (React as unknown as { version?: string }).version ?? "unknown",
};

export interface LeafletHealth {
  ok: boolean;
  reactVersion: string;
  reactLeafletVersion: string;
  errors: string[];
  warnings: string[];
}

/**
 * Verifies the runtime is using react-leaflet v4 paired with React 18.
 * react-leaflet v5 requires React 19 and breaks under React 18 with the
 * "render2 is not a function" Context.Consumer error.
 */
export function checkLeafletHealth(): LeafletHealth {
  const errors: string[] = [];
  const warnings: string[] = [];

  const reactVersion = (reactPkg as { version: string }).version;
  const reactLeafletVersion = (reactLeafletPkg as { version: string }).version;

  const reactMajor = parseInt(reactVersion.split(".")[0], 10);
  const rlMajor = parseInt(reactLeafletVersion.split(".")[0], 10);

  if (rlMajor !== 4) {
    errors.push(
      `react-leaflet v${reactLeafletVersion} detected — this app requires v4.x. ` +
        `v5+ requires React 19 and will crash under React ${reactMajor}.`
    );
  }

  if (reactMajor !== 18) {
    warnings.push(
      `React v${reactVersion} detected — react-leaflet v4 is tested against React 18.`
    );
  }

  if (rlMajor === 5 && reactMajor < 19) {
    errors.push(
      "Incompatible pairing: react-leaflet v5 with React <19 causes Context.Consumer to throw 'render2 is not a function'."
    );
  }

  // Sanity: required exports must be functions/components
  const required = ["MapContainer", "TileLayer", "Marker", "useMap"] as const;
  for (const name of required) {
    if (typeof (ReactLeaflet as Record<string, unknown>)[name] === "undefined") {
      errors.push(`react-leaflet is missing expected export: ${name}`);
    }
  }

  // Touch React to avoid unused-import in case tree-shakers strip it
  void React;

  return {
    ok: errors.length === 0,
    reactVersion,
    reactLeafletVersion,
    errors,
    warnings,
  };
}
