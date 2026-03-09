import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BODS_BASE_URL = "https://data.bus-data.dft.gov.uk/api/v1/datafeed";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BODS_API_KEY = Deno.env.get("BODS_API_KEY");
    if (!BODS_API_KEY) {
      throw new Error("BODS_API_KEY is not configured");
    }

    const { stopCodes, boundingBox, lineNames } = await req.json();

    // Build SIRI-VM endpoint URL for stop monitoring
    const params = new URLSearchParams({
      api_key: BODS_API_KEY,
    });

    // Use bounding box around Headingley, Leeds area by default
    if (boundingBox) {
      params.set("boundingBox", `${boundingBox.minLon},${boundingBox.minLat},${boundingBox.maxLon},${boundingBox.maxLat}`);
    }

    if (lineNames && lineNames.length > 0) {
      params.set("lineRef", lineNames.join(","));
    }

    // Fetch SIRI-VM data from the datafeed endpoint
    const siriUrl = `${BODS_BASE_URL}/?${params.toString()}`;
    console.log("Fetching BODS SIRI-VM:", siriUrl.replace(BODS_API_KEY, "***"));

    const response = await fetch(siriUrl);
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`BODS API error [${response.status}]:`, errorText);
      throw new Error(`BODS API returned ${response.status}`);
    }

    const xmlText = await response.text();

    // Parse SIRI-VM XML into simplified JSON
    const departures = parseSiriVM(xmlText, stopCodes || []);

    return new Response(JSON.stringify({
      departures,
      updatedAt: new Date().toISOString(),
      source: "live",
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("BODS proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      departures: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: errorMessage,
    }), {
      status: 200, // Return 200 so frontend can handle fallback gracefully
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function parseSiriVM(xml: string, stopCodes: string[]): any[] {
  const departures: any[] = [];

  // Extract VehicleActivity elements
  const activityRegex = /<VehicleActivity>([\s\S]*?)<\/VehicleActivity>/g;
  let match;

  while ((match = activityRegex.exec(xml)) !== null) {
    const activity = match[1];

    const getText = (tag: string): string => {
      const r = new RegExp(`<${tag}>([^<]*)</${tag}>`);
      const m = activity.match(r);
      return m ? m[1].trim() : "";
    };

    const recordedAtTime = getText("RecordedAtTime");
    const lineRef = getText("LineRef");
    const directionRef = getText("DirectionRef");
    const publishedLineName = getText("PublishedLineName") || lineRef;
    const destinationName = getText("DestinationName");
    const destinationRef = getText("DestinationRef");
    const originName = getText("OriginName");
    const originRef = getText("OriginRef");
    const operatorRef = getText("OperatorRef");
    const vehicleRef = getText("VehicleRef");
    const bearing = getText("Bearing");
    const longitude = getText("Longitude");
    const latitude = getText("Latitude");
    const blockRef = getText("BlockRef");
    const vehicleJourneyRef = getText("VehicleJourneyRef");

    // Extract monitored call info if present
    const monitoredCallMatch = activity.match(/<MonitoredCall>([\s\S]*?)<\/MonitoredCall>/);
    let stopPointRef = "";
    let aimedDepartureTime = "";
    let expectedDepartureTime = "";
    let aimedArrivalTime = "";
    let expectedArrivalTime = "";

    if (monitoredCallMatch) {
      const mc = monitoredCallMatch[1];
      const getMcText = (tag: string): string => {
        const r = new RegExp(`<${tag}>([^<]*)</${tag}>`);
        const m = mc.match(r);
        return m ? m[1].trim() : "";
      };
      stopPointRef = getMcText("StopPointRef");
      aimedDepartureTime = getMcText("AimedDepartureTime");
      expectedDepartureTime = getMcText("ExpectedDepartureTime");
      aimedArrivalTime = getMcText("AimedArrivalTime");
      expectedArrivalTime = getMcText("ExpectedArrivalTime");
    }

    // If stopCodes filter provided, only include matching stops
    if (stopCodes.length > 0 && stopPointRef && !stopCodes.some(sc => stopPointRef.includes(sc))) {
      continue;
    }

    // Calculate status
    let status: "on-time" | "delayed" | "early" = "on-time";
    let delayMinutes = 0;

    if (expectedDepartureTime && aimedDepartureTime) {
      const expected = new Date(expectedDepartureTime).getTime();
      const aimed = new Date(aimedDepartureTime).getTime();
      delayMinutes = Math.round((expected - aimed) / 60000);
      if (delayMinutes > 2) status = "delayed";
      else if (delayMinutes < -1) status = "early";
    } else if (expectedArrivalTime && aimedArrivalTime) {
      const expected = new Date(expectedArrivalTime).getTime();
      const aimed = new Date(aimedArrivalTime).getTime();
      delayMinutes = Math.round((expected - aimed) / 60000);
      if (delayMinutes > 2) status = "delayed";
      else if (delayMinutes < -1) status = "early";
    }

    // Calculate minutes until departure
    let minutesAway: number | null = null;
    const departureStr = expectedDepartureTime || aimedDepartureTime || expectedArrivalTime || aimedArrivalTime;
    if (departureStr) {
      const depTime = new Date(departureStr).getTime();
      const now = Date.now();
      minutesAway = Math.max(0, Math.round((depTime - now) / 60000));
    }

    departures.push({
      lineRef,
      lineName: publishedLineName,
      destination: destinationName || destinationRef,
      origin: originName || originRef,
      mode: "bus",
      aimedDepartureTime,
      expectedDepartureTime: expectedDepartureTime || aimedDepartureTime,
      status,
      delayMinutes,
      minutesAway,
      stopPointRef,
      operatorRef,
      vehicleRef,
      recordedAtTime,
      location: longitude && latitude ? { lng: parseFloat(longitude), lat: parseFloat(latitude) } : null,
    });
  }

  // Sort by minutes away
  departures.sort((a, b) => (a.minutesAway ?? 999) - (b.minutesAway ?? 999));

  // Return top 10
  return departures.slice(0, 10);
}
