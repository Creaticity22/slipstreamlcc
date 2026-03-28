import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BODS_DATAFEED_URL = "https://data.bus-data.dft.gov.uk/api/v1/datafeed/";
const BODS_TIMETABLE_URL = "https://data.bus-data.dft.gov.uk/api/v1/dataset/";
const NAPTAN_URL = "https://naptan.api.dft.gov.uk/v1/access-nodes";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const BODS_API_KEY = Deno.env.get("BODS_API_KEY");
    if (!BODS_API_KEY) {
      throw new Error("BODS_API_KEY is not configured");
    }

    const body = await req.json();
    const { endpoint = "datafeed", boundingBox, lineNames, stopCodes, operatorRef, noc, search, limit } = body;

    if (endpoint === "timetable") {
      return await handleTimetable(BODS_API_KEY, { noc, search, limit, boundingBox });
    }

    // Default: SIRI-VM live location data
    return await handleDatafeed(BODS_API_KEY, { boundingBox, lineNames, stopCodes, operatorRef });

  } catch (error) {
    console.error("BODS proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      departures: [],
      updatedAt: new Date().toISOString(),
      source: "error",
      error: errorMessage,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function handleDatafeed(
  apiKey: string,
  opts: { boundingBox?: any; lineNames?: string[]; stopCodes?: string[]; operatorRef?: string }
) {
  const params = new URLSearchParams();
  params.set("api_key", apiKey);

  // boundingBox format: minLongitude,minLatitude,maxLongitude,maxLatitude
  if (opts.boundingBox) {
    const bb = opts.boundingBox;
    params.set("boundingBox", `${bb.minLon},${bb.minLat},${bb.maxLon},${bb.maxLat}`);
  }

  // lineRef filter (optional – omit to get all lines)
  if (opts.lineNames && opts.lineNames.length > 0) {
    for (const line of opts.lineNames) {
      params.append("lineRef", line);
    }
  }

  if (opts.operatorRef) {
    params.set("operatorRef", opts.operatorRef);
  }

  const siriUrl = `${BODS_DATAFEED_URL}?${params.toString()}`;
  console.log("Fetching BODS SIRI-VM:", siriUrl.replace(apiKey, "***"));

  const response = await fetch(siriUrl);

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`BODS API error [${response.status}]:`, errorText.substring(0, 500));

    // If lineRef filter caused the error, retry without it
    if (opts.lineNames && opts.lineNames.length > 0) {
      console.log("Retrying without lineRef filter...");
      const retryParams = new URLSearchParams();
      retryParams.set("api_key", apiKey);
      if (opts.boundingBox) {
        const bb = opts.boundingBox;
        retryParams.set("boundingBox", `${bb.minLon},${bb.minLat},${bb.maxLon},${bb.maxLat}`);
      }
      const retryUrl = `${BODS_DATAFEED_URL}?${retryParams.toString()}`;
      console.log("Retry URL:", retryUrl.replace(apiKey, "***"));
      const retryResponse = await fetch(retryUrl);
      if (!retryResponse.ok) {
        const retryError = await retryResponse.text();
        console.error(`BODS retry error [${retryResponse.status}]:`, retryError.substring(0, 500));
        throw new Error(`BODS API returned ${retryResponse.status}`);
      }
      const xmlText = await retryResponse.text();
      // Filter in code by line names
      const departures = parseSiriVM(xmlText, opts.stopCodes || [], opts.lineNames);
      return new Response(JSON.stringify({
        departures,
        updatedAt: new Date().toISOString(),
        source: "live",
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`BODS API returned ${response.status}`);
  }

  const xmlText = await response.text();
  const departures = parseSiriVM(xmlText, opts.stopCodes || [], opts.lineNames || []);

  return new Response(JSON.stringify({
    departures,
    updatedAt: new Date().toISOString(),
    source: "live",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function handleTimetable(
  apiKey: string,
  opts: { noc?: string[]; search?: string; limit?: number; boundingBox?: any }
) {
  const params = new URLSearchParams();
  params.set("api_key", apiKey);
  params.set("status", "published");

  if (opts.noc && opts.noc.length > 0) {
    params.set("noc", opts.noc.join(","));
  }
  if (opts.search) {
    params.set("search", opts.search);
  }
  if (opts.limit) {
    params.set("limit", String(opts.limit));
  }
  if (opts.boundingBox) {
    const bb = opts.boundingBox;
    // Timetable uses same format: minLon,minLat,maxLon,maxLat
    params.set("boundingBox", `${bb.minLon},${bb.minLat},${bb.maxLon},${bb.maxLat}`);
  }

  const url = `${BODS_TIMETABLE_URL}?${params.toString()}`;
  console.log("Fetching BODS timetable:", url.replace(apiKey, "***"));

  const response = await fetch(url);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`BODS Timetable error [${response.status}]:`, errorText.substring(0, 500));
    throw new Error(`BODS Timetable API returned ${response.status}`);
  }

  const data = await response.json();

  return new Response(JSON.stringify({
    datasets: data.results || [],
    count: data.count || 0,
    updatedAt: new Date().toISOString(),
    source: "live",
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseSiriVM(xml: string, stopCodes: string[], lineFilter: string[]): any[] {
  const departures: any[] = [];

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
    const publishedLineName = getText("PublishedLineName") || lineRef;
    const destinationName = getText("DestinationName");
    const destinationRef = getText("DestinationRef");
    const originName = getText("OriginName");
    const originRef = getText("OriginRef");
    const operatorRef = getText("OperatorRef");
    const vehicleRef = getText("VehicleRef");
    const longitude = getText("Longitude");
    const latitude = getText("Latitude");

    // If we have a lineFilter, only include matching lines
    if (lineFilter.length > 0) {
      const matchesLine = lineFilter.some(
        (l) => l === lineRef || l === publishedLineName || lineRef.includes(l) || publishedLineName.includes(l)
      );
      if (!matchesLine) continue;
    }

    // Extract monitored call info
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

    // Stop code filter
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

    // Minutes until departure
    let minutesAway: number | null = null;
    const departureStr = expectedDepartureTime || aimedDepartureTime || expectedArrivalTime || aimedArrivalTime;
    if (departureStr) {
      const depTime = new Date(departureStr).getTime();
      minutesAway = Math.max(0, Math.round((depTime - Date.now()) / 60000));
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

  // Return more results for national coverage
  return departures.slice(0, 50);
}
