import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://slipstreamlcc.lovable.app",
  "https://slipstreamgo.live",
  "https://www.slipstreamgo.live",
  "http://localhost:5173",
  "http://localhost:8080",
];
const ALLOWED_ORIGIN_SUFFIXES = [".lovable.app", ".lovableproject.com", ".lovable.dev"];
const ALLOWED_HEADERS =
  "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version";

function isAllowedOrigin(origin: string): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  try {
    const host = new URL(origin).hostname;
    return ALLOWED_ORIGIN_SUFFIXES.some((s) => host.endsWith(s));
  } catch {
    return false;
  }
}

function buildCorsHeaders(req: Request) {
  const origin = req.headers.get("Origin") ?? "";
  const allowedOrigin = isAllowedOrigin(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": ALLOWED_HEADERS,
    Vary: "Origin",
  };
}

interface Coords {
  lat: number;
  lng: number;
}

interface JourneyLeg {
  mode: "bus" | "train" | "walk";
  line: string;
  from: string;
  to: string;
  durationMins: number;
  distanceM: number;
  departure: string;
  arrival: string;
  headsign?: string;
}

interface JourneyOption {
  type: "fastest" | "least-changes" | "lowest-carbon";
  departureTime: string;
  arrivalTime: string;
  durationMins: number;
  changes: number;
  co2Kg: number;
  legs: JourneyLeg[];
}

async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 10000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...init, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

async function geocode(place: string): Promise<Coords | null> {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1&countrycodes=gb`;
  const res = await fetchWithTimeout(url, {
    headers: { "User-Agent": "SlipstreamApp/1.0", Accept: "application/json" },
  });
  if (!res.ok) return null;
  const data = await res.json();
  if (!Array.isArray(data) || data.length === 0) return null;
  const lat = Number(data[0].lat);
  const lng = Number(data[0].lon);
  if (!isFinite(lat) || !isFinite(lng)) return null;
  return { lat, lng };
}

function mapMode(m: string): "bus" | "train" | "walk" {
  const x = (m || "").toLowerCase();
  if (x === "foot" || x === "walk" || x === "walking") return "walk";
  if (x === "bus" || x === "coach") return "bus";
  return "train";
}

function co2ForLeg(mode: "bus" | "train" | "walk", distM: number): number {
  const km = distM / 1000;
  if (mode === "bus") return km * 0.089;
  if (mode === "train") return km * 0.035;
  return 0;
}

interface RawLeg {
  mode?: string;
  line_name?: string;
  operator_name?: string;
  origin_name?: string;
  destination_name?: string;
  duration?: string | number;
  distance?: string | number;
  departure_time?: string;
  arrival_time?: string;
  departs_at?: string;
  arrives_at?: string;
}

function parseDuration(d: unknown): number {
  if (typeof d === "number") return Math.round(d / 60);
  if (typeof d === "string") {
    // formats: "PT15M", "00:15:00", "15"
    const iso = d.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
    if (iso) return (Number(iso[1] || 0) * 60) + Number(iso[2] || 0);
    const hms = d.match(/^(\d+):(\d+)(?::(\d+))?$/);
    if (hms) return Number(hms[1]) * 60 + Number(hms[2]);
    const n = Number(d);
    if (!isNaN(n)) return Math.round(n / 60);
  }
  return 0;
}

function hhmm(s: string | undefined): string {
  if (!s) return "";
  const m = s.match(/(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s;
}

function mapRoute(route: { duration?: string | number; departure_time?: string; arrival_time?: string; routes?: RawLeg[]; route_parts?: RawLeg[] }): JourneyOption | null {
  const rawLegs: RawLeg[] = route.route_parts || route.routes || [];
  if (!rawLegs.length) return null;
  const legs: JourneyLeg[] = rawLegs.map((l) => {
    const mode = mapMode(l.mode || "");
    const distM = Number(l.distance || 0) || 0;
    return {
      mode,
      line: l.line_name || l.operator_name || (mode === "walk" ? "Walk" : "Service"),
      from: l.origin_name || "",
      to: l.destination_name || "",
      durationMins: parseDuration(l.duration),
      distanceM: distM,
      departure: hhmm(l.departure_time || l.departs_at),
      arrival: hhmm(l.arrival_time || l.arrives_at),
    };
  });
  const departureTime = hhmm(route.departure_time) || legs[0]?.departure || "";
  const arrivalTime = hhmm(route.arrival_time) || legs[legs.length - 1]?.arrival || "";
  const durationMins = parseDuration(route.duration) || legs.reduce((s, l) => s + l.durationMins, 0);
  const transitLegs = legs.filter((l) => l.mode !== "walk");
  const changes = Math.max(0, transitLegs.length - 1);
  const co2Kg = legs.reduce((s, l) => s + co2ForLeg(l.mode, l.distanceM), 0);
  return {
    type: "fastest",
    departureTime,
    arrivalTime,
    durationMins,
    changes,
    co2Kg: Math.round(co2Kg * 1000) / 1000,
    legs,
  };
}

function pickTopThree(all: JourneyOption[]): JourneyOption[] {
  if (all.length === 0) return [];
  const fastest = [...all].sort((a, b) => a.durationMins - b.durationMins)[0];
  const leastChanges = [...all].sort(
    (a, b) => a.changes - b.changes || a.durationMins - b.durationMins
  )[0];
  const lowestCarbon = [...all].sort(
    (a, b) => a.co2Kg - b.co2Kg || a.durationMins - b.durationMins
  )[0];

  const sigOf = (o: JourneyOption) =>
    `${o.departureTime}|${o.arrivalTime}|${o.legs.map((l) => l.line).join(">")}`;

  const out: JourneyOption[] = [];
  const seen = new Set<string>();
  const add = (o: JourneyOption, type: JourneyOption["type"]) => {
    const sig = sigOf(o);
    if (seen.has(sig)) return;
    seen.add(sig);
    out.push({ ...o, type });
  };
  add(fastest, "fastest");
  add(leastChanges, "least-changes");
  add(lowestCarbon, "lowest-carbon");
  return out;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const sb = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await sb.auth.getUser(token);
    if (userError || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appId = Deno.env.get("TRANSPORT_API_APP_ID");
    const appKey = Deno.env.get("TRANSPORT_API_APP_KEY");
    if (!appId || !appKey) {
      return new Response(
        JSON.stringify({ options: [], error: "Journey planner not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const from = typeof body?.from === "string" ? body.from.trim() : "";
    const to = typeof body?.to === "string" ? body.to.trim() : "";
    let fromCoords: Coords | undefined = body?.fromCoords;
    let toCoords: Coords | undefined = body?.toCoords;

    if (!from || !to) {
      return new Response(JSON.stringify({ options: [], error: "Missing from/to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!fromCoords) fromCoords = (await geocode(from)) ?? undefined;
    if (!toCoords) toCoords = (await geocode(to)) ?? undefined;

    if (!fromCoords || !toCoords) {
      return new Response(
        JSON.stringify({ options: [], error: "Could not locate one of the places" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const url =
      `https://transportapi.com/v3/uk/public/journey/from/lonlat:${fromCoords.lng},${fromCoords.lat}` +
      `/to/lonlat:${toCoords.lng},${toCoords.lat}.json` +
      `?app_id=${encodeURIComponent(appId)}&app_key=${encodeURIComponent(appKey)}` +
      `&modes=bus,train&region=south_east`;

    const res = await fetchWithTimeout(url);
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      console.error("TransportAPI error", res.status, text.slice(0, 500));
      return new Response(
        JSON.stringify({ options: [], error: "No routes found between these places" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    const json = await res.json();
    const rawRoutes: Array<Record<string, unknown>> = Array.isArray(json?.routes) ? json.routes : [];
    const mapped = rawRoutes
      .map((r) => mapRoute(r as Parameters<typeof mapRoute>[0]))
      .filter((o): o is JourneyOption => !!o);

    if (mapped.length === 0) {
      return new Response(
        JSON.stringify({ options: [], error: "No routes found between these places" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const options = pickTopThree(mapped);
    return new Response(JSON.stringify({ options }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("journey-planner error:", e);
    return new Response(
      JSON.stringify({ options: [], error: "No routes found between these places" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
