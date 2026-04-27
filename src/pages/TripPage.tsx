import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, CheckCircle2, MapPin, AlertTriangle, Share2, Copy, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface TripStep {
  stepNumber: number;
  title: string;
  instruction: string;
  durationMins?: number;
}

interface Trip {
  id: string;
  user_id: string;
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
  message: string | null;
  created_at: string;
}

const TripPage = () => {
  const navigate = useNavigate();
  const { tripId } = useParams<{ tripId: string }>();
  const { user } = useAuth();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const load = async () => {
    if (!tripId) return;
    const { data } = await supabase.from("trips").select("*").eq("id", tripId).maybeSingle();
    if (data) setTrip(data as unknown as Trip);
    const { data: ci } = await supabase
      .from("check_ins")
      .select("*")
      .eq("trip_id", tripId)
      .order("created_at", { ascending: false });
    setCheckIns((ci as CheckIn[]) ?? []);
  };

  useEffect(() => {
    load();
  }, [tripId]);

  const checkIn = async (type: "all_good" | "im_here" | "need_help", message?: string) => {
    if (!trip || !user) return;
    await supabase.from("check_ins").insert({
      trip_id: trip.id,
      user_id: user.id,
      type,
      message: message ?? null,
    });
    await supabase.from("trips").update({ last_check_in_at: new Date().toISOString() }).eq("id", trip.id);
    toast({ title: type === "need_help" ? "Help signal sent" : "Checked in" });
    if (type === "need_help") navigate("/help");
    load();
  };

  const advanceStep = async () => {
    if (!trip) return;
    const total = trip.plan_json?.steps?.length ?? 0;
    const nextStep = trip.current_step_number + 1;
    if (nextStep > total) {
      await supabase
        .from("trips")
        .update({ status: "completed", ended_at: new Date().toISOString() })
        .eq("id", trip.id);
      toast({ title: "Trip complete!", description: "Nice one. You made it." });
      navigate("/");
      return;
    }
    await supabase.from("trips").update({ current_step_number: nextStep }).eq("id", trip.id);
    await checkIn("im_here", `Reached step ${trip.current_step_number}`);
  };

  const cancelTrip = async () => {
    if (!trip) return;
    await supabase
      .from("trips")
      .update({ status: "cancelled", ended_at: new Date().toISOString() })
      .eq("id", trip.id);
    navigate("/");
  };

  const createShare = async () => {
    if (!trip || !user) return;
    const { data, error } = await supabase
      .from("trip_shares")
      .insert({ trip_id: trip.id, user_id: user.id })
      .select()
      .single();
    if (error || !data) {
      toast({ title: "Couldn't create share link", variant: "destructive" });
      return;
    }
    const url = `${window.location.origin}/trip/share/${data.share_token}`;
    setShareUrl(url);
    if (navigator.share) {
      navigator.share({ title: "My Slipstream trip", text: "Follow my trip", url }).catch(() => {});
    }
  };

  const copyShare = () => {
    if (!shareUrl) return;
    navigator.clipboard.writeText(shareUrl);
    toast({ title: "Link copied" });
  };

  if (!trip) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-muted-foreground">
        Loading trip…
      </div>
    );
  }

  const steps = trip.plan_json?.steps ?? [];
  const current = steps.find((s) => s.stepNumber === trip.current_step_number);
  const next = steps.find((s) => s.stepNumber === trip.current_step_number + 1);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">Trip in progress</p>
          <h1 className="text-2xl font-display font-bold mt-1">
            {trip.from_label || "Start"} → {trip.to_label || "Destination"}
          </h1>
        </motion.div>

        {/* Help Now */}
        <button
          onClick={() => navigate("/help")}
          className="w-full bg-destructive/10 border border-destructive/40 text-destructive rounded-xl p-3 mb-4 font-semibold flex items-center justify-center gap-2"
        >
          <AlertTriangle className="w-5 h-5" /> Help now
        </button>

        {/* Current step */}
        {current && (
          <div className="bg-gradient-primary text-primary-foreground rounded-2xl p-5 mb-4">
            <p className="text-xs uppercase tracking-wider opacity-80 mb-1">Step {current.stepNumber} of {steps.length}</p>
            <h2 className="text-xl font-display font-bold mb-2">{current.title}</h2>
            <p className="text-sm opacity-90 leading-relaxed">{current.instruction}</p>
            {current.durationMins != null && (
              <p className="text-xs opacity-75 mt-2">~{current.durationMins} min</p>
            )}
          </div>
        )}

        {/* Next step */}
        {next && (
          <div className="bg-card border border-border rounded-xl p-4 mb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Up next</p>
            <p className="font-semibold">{next.title}</p>
            <p className="text-sm text-muted-foreground">{next.instruction}</p>
          </div>
        )}

        {/* Actions */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button onClick={() => checkIn("all_good")} variant="outline" className="h-12">
            <CheckCircle2 className="w-4 h-4 mr-2" /> All good
          </Button>
          <Button onClick={advanceStep} className="h-12">
            <MapPin className="w-4 h-4 mr-2" /> I'm here
          </Button>
        </div>

        {/* Share */}
        {!shareUrl ? (
          <Button onClick={createShare} variant="outline" className="w-full mb-4">
            <Share2 className="w-4 h-4 mr-2" /> Share my trip
          </Button>
        ) : (
          <div className="bg-card border border-border rounded-xl p-3 mb-4">
            <p className="text-xs text-muted-foreground mb-2">Share link (valid 24h):</p>
            <div className="flex gap-2 items-center">
              <code className="text-xs bg-muted rounded px-2 py-1.5 flex-1 truncate">{shareUrl}</code>
              <Button size="icon" variant="outline" onClick={copyShare}>
                <Copy className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* Recent check-ins */}
        {checkIns.length > 0 && (
          <div className="mb-4">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Check-ins</p>
            <div className="space-y-1.5">
              {checkIns.slice(0, 5).map((c) => (
                <div key={c.id} className="bg-card border border-border rounded-lg p-2.5 text-xs flex justify-between">
                  <span className="font-medium">{c.type.replace("_", " ")}</span>
                  <span className="text-muted-foreground">{new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <Button onClick={cancelTrip} variant="ghost" className="w-full text-muted-foreground">
          <Square className="w-4 h-4 mr-2" /> End trip
        </Button>
      </div>
    </div>
  );
};

export default TripPage;
