import { describe, it, expect, vi, beforeEach } from "vitest";
import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

// --- Mocks ---
const stablePosition = { lat: 53.8, lng: -1.55 };
const stableGeo = {
  position: stablePosition,
  loading: false,
  error: null,
  refresh: () => {},
  toBbox: () => null,
};
vi.mock("@/hooks/useGeolocation", () => ({
  useGeolocation: () => stableGeo,
}));

vi.mock("@/hooks/useFrequentJourneys", () => ({
  useFrequentJourneys: () => ({ journeys: [], logJourney: vi.fn() }),
}));

vi.mock("@/hooks/usePreferences", () => ({
  usePreferences: () => ({ prefs: null }),
}));

vi.mock("@/services/naptanService", () => ({
  fetchNearbyStops: vi.fn(async () => ({
    stops: [
      { atcoCode: "450010101", name: "Headingley Lane", lat: 53.82, lng: -1.57, distanceKm: 0.12 },
    ],
    count: 1,
    source: "live" as const,
    updatedAt: new Date().toISOString(),
  })),
}));

import JourneySearch from "@/components/JourneySearch";
import NearbyStopsRow from "@/components/NearbyStopsRow";

function Harness() {
  const [fromOverride, setFromOverride] = useState("");
  return (
    <MemoryRouter>
      <JourneySearch externalFrom={fromOverride} />
      <NearbyStopsRow onSelect={setFromOverride} />
    </MemoryRouter>
  );
}

describe("NearbyStopsRow → JourneySearch", () => {
  beforeEach(() => vi.clearAllMocks());

  it("populates the 'Where from?' field when a nearby stop is tapped", async () => {
    render(<Harness />);

    const fromInput = screen.getByPlaceholderText("Where from?") as HTMLInputElement;
    expect(fromInput.value).toBe("");

    const stopButton = await screen.findByRole("button", { name: /Headingley Lane/i });
    fireEvent.click(stopButton);

    await waitFor(() => expect(fromInput.value).toBe("Headingley Lane"));
  });
});
