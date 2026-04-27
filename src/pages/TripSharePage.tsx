import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, MapPin, Clock, Shield, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Share {
  id: string;
  trip_id: string;
  expires_at: string;
}

interface TripStep {
  stepNumber: number;
  title: string;
  instruction: string;
}

interface Trip {
  id: string;
  from_label: string | null;
  to_label: string | null;
  plan_json: { steps: TripStep[] } | null;
  status: string;
  current_step_number: number;
  started_at: string;
  ended_at: string | null;
  last_check_in_at: string | null;
}

interface CheckIn {
  id: string;
  type: string;
  created_at: string;
}

const TripSharePage = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [share, setShare] = useState<Share | null>(null);
  const [trip, setTrip] = useState<Trip | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      const { data: shareRow } = await supabase
        .from("trip_shares")
        .select("*")
        .eq("share_token", token)
        .maybeSingle();
      if (!shareRow) {
        setLoading(false);
        return;
      }
      setShare(shareRow as Share);
      const { data: tripRow } = await supabase
        .from("trips")
        .select("*")
        .eq("id", shareRow.trip_id)
        .maybeSingle();
      setTrip(tripRow as unknown as Trip);
      const { data: ci } = await supabase
        .from("check_ins")
        .select("*")
        .eq("trip_id", shareRow.trip_id)
        .order("created_at", { ascending: false });
      setCheckIns((ci as CheckIn[]) ?? []);
      setLoading(false);
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [token]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">Loading…</div>;
  }

  if (!share || !trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6 text-center">
        <div>
          <AlertTriangle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-semibold mb-1">This trip link isn't available</p>
          <p className="text-sm text-muted-foreground">It may have expired or been removed.</p>
        </div>
      </div>
    );
  }

  const expired = new Date(share.expires_at) < new Date();
  const steps = trip.plan_json?.steps ?? [];
  const current = steps.find((s) => s.stepNumber === trip.current_step_number);
  const lastCheckIn = checkIns[0];

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-8">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <div className="flex items-center gap-2 text-primary mb-2">
            <Shield className="w-5 h-5" />
            <span className="text-sm font-semibold uppercase tracking-wider">Slipstream trip share</span>
          </div>
          <h1 className="text-2xl font-display font-bold">
            {trip.from_label || "Start"} → {trip.to_label || "Destination"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Status: <span className="font-medium text-foreground capitalize">{trip.status.replace("_", " ")}</span>
          </p>
        </motion.div>

        {expired && (
          <div className="bg-muted rounded-xl p-3 mb-4 text-sm text-muted-foreground text-center">
            This share link has expired.
          </div>
        )}

        {current && trip.status === "in_progress" && (
          <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-5 mb-4">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Currently on step {current.stepNumber} of {steps.length}</p>
            <h2 className="text-lg font-display font-bold mb-1">{current.title}</h2>
            <p className="text-sm opacity-90">{current.instruction}</p>
          </div>
        )}

        {lastCheckIn && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm capitalize">Last check-in: {lastCheckIn.type.replace("_", " ")}</p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" /> {new Date(lastCheckIn.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        )}

        <div className="mb-6">
          <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Journey plan</p>
          <ol className="space-y-2">
            {steps.map((s) => (
              <li
                key={s.stepNumber}
                className={`flex gap-3 p-3 rounded-xl border ${
                  s.stepNumber < trip.current_step_number
                    ? "bg-muted/40 border-border opacity-60"
                    : s.stepNumber === trip.current_step_number
                    ? "bg-card border-primary"
                    : "bg-card border-border"
                }`}
              >
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  s.stepNumber < trip.current_step_number
                    ? "bg-primary text-primary-foreground"
                    : s.stepNumber === trip.current_step_number
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}>
                  {s.stepNumber < trip.current_step_number ? <CheckCircle2 className="w-4 h-4" /> : s.stepNumber}
                </div>
                <div>
                  <p className="font-semibold text-sm">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{s.instruction}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="text-xs text-muted-foreground text-center bg-card rounded-xl p-3 border border-border flex items-center justify-center gap-2">
          <MapPin className="w-3 h-3" />
          Updates automatically every 30 seconds.
        </div>
      </div>
    </div>
  );
};

export default TripSharePage;
