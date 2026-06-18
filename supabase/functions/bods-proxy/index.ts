// BODS proxy — requires authenticated user

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://slipstreamlcc.lovable.app",
  "https://slipstreamgo.live",
  "https://www.slipstreamgo.live",
  "http://localhost:5173",
  "http://localhost:8080",
];

const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    "Vary": "Origin",
  };
}

const BODS_DATAFEED_URL = "https://data.bus-data.dft.gov.uk/api/v1/datafeed/";
const BODS_TIMETABLE_URL = "https://data.bus-data.dft.gov.uk/api/v1/dataset/";
const NAPTAN_URL = "https://naptan.api.dft.gov.uk/v1/access-nodes";

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const authClient = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: userData, error: userError } = await authClient.auth.getUser(token);
  if (userError || !userData?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const BODS_API_KEY = Deno.env.get("BODS_API_KEY");
    if (!BODS_API_KEY) {
      throw new Error("BODS_API_KEY is not configured");
    }

    const body = await req.json();
    const { endpoint = "datafeed", boundingBox, lineNames, stopCodes, operatorRef, noc, search, limit, lat, lng, radiusKm, atcoAreaCodes } = body;

    if (endpoint === "naptan") {
      return await handleNaptan({ lat, lng, radiusKm, atcoAreaCodes, boundingBox }, corsHeaders);
    }

    if (endpoint === "timetable") {
      return await handleTimetable(BODS_API_KEY, { noc, search, limit, boundingBox }, corsHeaders);
    }

    // Default: SIRI-VM live location data
    return await handleDatafeed(BODS_API_KEY, { boundingBox, lineNames, stopCodes, operatorRef }, corsHeaders);

  } catch (error) {
    console.error("BODS proxy error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    // Always return 200 with a fallback signal so the client never sees a 5xx
    return new Response(JSON.stringify({
      departures: [],
      stops: [],
      datasets: [],
      count: 0,
      updatedAt: new Date().toISOString(),
      source: "error",
      fallback: true,
      error: errorMessage,
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



// Dedupe concurrent NaPTAN fetches per cacheKey to avoid OOM from parallel large CSV downloads
const naptanInFlight: Map<string, Promise<any[]>> = new Map();

async function handleDatafeed(
  apiKey: string,
  opts: { boundingBox?: any; lineNames?: string[]; stopCodes?: string[]; operatorRef?: string },
  corsHeaders: Record<string, string>,
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
  opts: { noc?: string[]; search?: string; limit?: number; boundingBox?: any },
  corsHeaders: Record<string, string>,
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
    const occupancyRaw = getText("OccupancyStatus");
    const occupancy = occupancyRaw || null;

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
      occupancy,
      location: longitude && latitude ? { lng: parseFloat(longitude), lat: parseFloat(latitude) } : null,
    });
  }

  // Sort by minutes away
  departures.sort((a, b) => (a.minutesAway ?? 999) - (b.minutesAway ?? 999));

  // Return more results for national coverage
  return departures.slice(0, 50);
}

// In-memory NaPTAN cache keyed by ATCO area codes
const naptanCache: Map<string, { data: any[]; fetchedAt: number }> = new Map();
const NAPTAN_CACHE_TTL = 3600_000; // 1 hour

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Determine ATCO area codes from lat/lng (approximate mapping for major English regions)
function guessAtcoAreas(lat: number, lng: number): string[] {
  // Major metropolitan areas with their approximate centres and ATCO codes
  const areas: { code: string; lat: number; lng: number; radius: number }[] = [
    { code: "450", lat: 53.8, lng: -1.55, radius: 40 },  // West Yorkshire
    { code: "320", lat: 53.48, lng: -2.24, radius: 30 },  // Greater Manchester
    { code: "410", lat: 53.74, lng: -0.35, radius: 30 },  // East Yorkshire / Hull
    { code: "370", lat: 53.38, lng: -1.47, radius: 30 },  // South Yorkshire
    { code: "290", lat: 52.48, lng: -1.89, radius: 30 },  // West Midlands
    { code: "240", lat: 51.51, lng: -0.13, radius: 40 },  // London
    { code: "340", lat: 54.97, lng: -1.61, radius: 30 },  // Tyne and Wear
    { code: "350", lat: 53.75, lng: -1.0, radius: 30 },   // North Yorkshire
    { code: "250", lat: 53.41, lng: -2.99, radius: 30 },  // Merseyside
    { code: "440", lat: 53.57, lng: -1.48, radius: 30 },  // Wakefield area
    { code: "460", lat: 53.59, lng: -1.8, radius: 30 },   // Calderdale/Kirklees
  ];

  const matched = areas
    .filter(a => haversineKm(lat, lng, a.lat, a.lng) < a.radius)
    .map(a => a.code);

  // Default to West Yorkshire if nothing matched
  return matched.length > 0 ? matched : ["450"];
}

async function handleNaptan(opts: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  atcoAreaCodes?: string[];
  boundingBox?: any;
}, corsHeaders: Record<string, string>) {
  const lat = opts.lat ?? 53.825;
  const lng = opts.lng ?? -1.576;
  const radiusKm = opts.radiusKm ?? 1;
  const codes = opts.atcoAreaCodes ?? guessAtcoAreas(lat, lng);
  const cacheKey = codes.sort().join(",");

  // Check cache
  const cached = naptanCache.get(cacheKey);
  if (cached && Date.now() - cached.fetchedAt < NAPTAN_CACHE_TTL) {
    console.log(`NaPTAN cache hit for ${cacheKey}`);
    const nearby = filterByProximity(cached.data, lat, lng, radiusKm);
    return new Response(JSON.stringify({
      stops: nearby,
      count: nearby.length,
      source: "cached",
      updatedAt: new Date(cached.fetchedAt).toISOString(),
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch from NaPTAN API (deduped across concurrent invocations)
  let fetchPromise = naptanInFlight.get(cacheKey);
  if (!fetchPromise) {
    const url = `${NAPTAN_URL}?atcoAreaCodes=${codes.join(",")}&dataFormat=csv`;
    console.log("Fetching NaPTAN data:", url);
    fetchPromise = (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        const errText = await response.text();
        console.error(`NaPTAN error [${response.status}]:`, errText.substring(0, 300));
        throw new Error(`NaPTAN API returned ${response.status}`);
      }
      const csvText = await response.text();
      const parsed = parseNaptanCsv(csvText);
      console.log(`Parsed ${parsed.length} NaPTAN stops for areas ${cacheKey}`);
      naptanCache.set(cacheKey, { data: parsed, fetchedAt: Date.now() });
      return parsed;
    })().finally(() => {
      naptanInFlight.delete(cacheKey);
    });
    naptanInFlight.set(cacheKey, fetchPromise);
  }

  const stops = await fetchPromise;
  const nearby = filterByProximity(stops, lat, lng, radiusKm);

  return new Response(JSON.stringify({
    stops: nearby,
    count: nearby.length,
    source: "live",
    updatedAt: new Date().toISOString(),
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function parseNaptanCsv(csv: string): any[] {
  const lines = csv.split("\n");
  if (lines.length < 2) return [];

  const header = lines[0].split(",");
  const atcoIdx = header.indexOf("ATCOCode");
  const nameIdx = header.indexOf("CommonName");
  const indIdx = header.indexOf("Indicator");
  const streetIdx = header.indexOf("Street");
  const localityIdx = header.indexOf("LocalityName");
  const latIdx = header.indexOf("Latitude");
  const lngIdx = header.indexOf("Longitude");
  const typeIdx = header.indexOf("StopType");
  const statusIdx = header.indexOf("Status");
  const bearingIdx = header.indexOf("Bearing");

  const stops: any[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    if (cols.length < Math.max(latIdx, lngIdx, typeIdx, statusIdx) + 1) continue;

    const status = cols[statusIdx]?.trim();
    if (status !== "active") continue;

    const stopType = cols[typeIdx]?.trim();
    // Only bus stops (BCT = Bus Coach Tram, BCS = Bus Coach Station bay)
    if (stopType !== "BCT" && stopType !== "BCS" && stopType !== "BCQ") continue;

    const lat = parseFloat(cols[latIdx]);
    const lng = parseFloat(cols[lngIdx]);
    if (isNaN(lat) || isNaN(lng)) continue;

    stops.push({
      atcoCode: cols[atcoIdx]?.trim(),
      name: cols[nameIdx]?.trim(),
      indicator: cols[indIdx]?.trim(),
      street: cols[streetIdx]?.trim(),
      locality: cols[localityIdx]?.trim(),
      bearing: cols[bearingIdx]?.trim(),
      lat,
      lng,
      stopType,
    });
  }

  return stops;
}

function filterByProximity(stops: any[], lat: number, lng: number, radiusKm: number): any[] {
  return stops
    .map(s => ({ ...s, distanceKm: haversineKm(lat, lng, s.lat, s.lng) }))
    .filter(s => s.distanceKm <= radiusKm)
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, 30);
}
