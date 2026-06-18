import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Bar, BarChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { Leaf, MapPin, Bus, CheckCircle2, Share2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import BrandHeader from "@/components/BrandHeader";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TripRow {
  id: string;
  from_label: string | null;
  to_label: string | null;
  started_at: string;
  ended_at: string | null;
  status: string;
  co2_saved_kg: number | null;
  distance_km: number | null;
}

const PAGE_SIZE = 10;

function formatDateTime(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function durationMins(start: string, end: string | null): string | null {
  if (!end) return null;
  const mins = Math.max(0, Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000));
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${h}h ${m}m`;
}

function dayKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default function HistoryPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [trips, setTrips] = useState<TripRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(PAGE_SIZE);

  const load = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("trips")
      .select("id, from_label, to_label, started_at, ended_at, status, co2_saved_kg, distance_km")
      .eq("user_id", user.id)
      .eq("status", "completed")
      .order("started_at", { ascending: false });
    setTrips((data as TripRow[] | null) ?? []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const totalTrips = trips.length;
    const totalCo2 = trips.reduce((s, t) => s + (t.co2_saved_kg ?? 0), 0);
    const totalDist = trips.reduce((s, t) => s + (t.distance_km ?? 0), 0);
    return { totalTrips, totalCo2, totalDist };
  }, [trips]);

  const weekData = useMemo(() => {
    const days: { key: string; label: string; co2: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i);
      d.setHours(0, 0, 0, 0);
      days.push({ key: dayKey(d), label: DAY_LABELS[d.getDay()], co2: 0 });
    }
    const byKey = new Map(days.map((d) => [d.key, d]));
    for (const t of trips) {
      const key = dayKey(new Date(t.started_at));
      const slot = byKey.get(key);
      if (slot) slot.co2 += t.co2_saved_kg ?? 0;
    }
    return days;
  }, [trips]);

  const hasWeekData = weekData.some((d) => d.co2 > 0);
  const visibleTrips = trips
    .filter((t) => t.from_label || t.to_label)
    .slice(0, visible);

  const share = async () => {
    const text = `I've saved ${stats.totalCo2.toFixed(1)}kg of CO₂ and completed ${stats.totalTrips} green trips with Slipstream 🌱\nTravel smarter across Yorkshire: slipstreamlcc.lovable.app`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My Slipstream impact", text });
        return;
      } catch {
        // user cancelled
      }
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Copied to clipboard!" });
    } catch {
      toast({ title: "Couldn't share", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader title="Your history" subtitle="Trips, CO₂ saved and progress over time" />

        {!user ? (
          <div className="mt-4 bg-card border border-border rounded-2xl p-6 text-center">
            <p className="text-sm font-semibold text-foreground mb-2">Sign in to see your stats</p>
            <p className="text-xs text-muted-foreground mb-4">
              Track every trip, CO₂ saved and weekly progress.
            </p>
            <Button onClick={() => navigate("/profile")}>Go to profile</Button>
          </div>
        ) : (
          <>
            {/* Stats bar */}
            <div className="grid grid-cols-3 gap-2 mt-4">
              <StatTile label="Trips" value={String(stats.totalTrips)} icon={<Bus className="w-4 h-4 text-primary" />} />
              <StatTile label="CO₂ saved" value={`${stats.totalCo2.toFixed(1)} kg`} icon={<Leaf className="w-4 h-4 text-slipstream-teal" />} />
              <StatTile label="Distance" value={`${stats.totalDist.toFixed(1)} km`} icon={<MapPin className="w-4 h-4 text-slipstream-coral" />} />
            </div>

            <Button
              onClick={share}
              variant="outline"
              className="w-full mt-3 h-11"
              disabled={stats.totalTrips === 0}
            >
              <Share2 className="w-4 h-4 mr-2" /> Share my impact
            </Button>

            {/* Weekly chart */}
            <div className="mt-5 bg-card border border-border rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-display font-bold text-foreground">CO₂ saved · last 7 days</h3>
                <span className="text-[11px] text-muted-foreground">
                  {weekData.reduce((s, d) => s + d.co2, 0).toFixed(2)} kg
                </span>
              </div>
              {hasWeekData ? (
                <div className="h-40 -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekData} margin={{ top: 6, right: 6, left: 0, bottom: 0 }}>
                      <XAxis dataKey="label" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <RTooltip
                        formatter={(v: number) => [`${v.toFixed(2)} kg`, "CO₂ saved"]}
                        labelStyle={{ fontSize: 12 }}
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                      />
                      <Bar dataKey="co2" radius={[6, 6, 0, 0]} fill="hsl(var(--primary))" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground py-6 text-center">
                  No trips yet this week — start one from the home screen!
                </p>
              )}
            </div>

            {/* Timeline */}
            <h3 className="mt-6 mb-3 text-base font-display font-bold text-foreground">
              Trip timeline
            </h3>

            {loading ? (
              <div className="h-24 rounded-2xl bg-muted animate-pulse" />
            ) : visibleTrips.length === 0 ? (
              <p className="text-sm text-muted-foreground bg-card border border-border rounded-2xl p-6 text-center">
                No completed trips yet. Plan a journey from the home screen to start tracking.
              </p>
            ) : (
              <div className="space-y-2">
                {visibleTrips.map((t, i) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="bg-card border border-border rounded-2xl p-3.5"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <span className="truncate">{t.from_label || "Start"}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate">{t.to_label || "Destination"}</span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>{formatDateTime(t.started_at)}</span>
                      <span className="inline-flex items-center gap-1 text-slipstream-teal font-semibold">
                        <CheckCircle2 className="w-3 h-3" /> Completed
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                      {durationMins(t.started_at, t.ended_at) && (
                        <span>⏱ {durationMins(t.started_at, t.ended_at)}</span>
                      )}
                      {t.co2_saved_kg != null && (
                        <span className="text-slipstream-teal">🌱 {t.co2_saved_kg.toFixed(2)} kg CO₂</span>
                      )}
                      {t.distance_km != null && <span>{t.distance_km.toFixed(1)} km</span>}
                    </div>
                  </motion.div>
                ))}
                {trips.length > visible && (
                  <Button
                    variant="outline"
                    className="w-full mt-1"
                    onClick={() => setVisible((v) => v + PAGE_SIZE)}
                  >
                    Load more
                  </Button>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function StatTile({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-2xl p-3 flex flex-col gap-1 items-start">
      <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">{icon}</div>
      <p className="text-[11px] text-muted-foreground">{label}</p>
      <p className="text-base font-display font-bold text-foreground leading-tight">{value}</p>
    </div>
  );
}
