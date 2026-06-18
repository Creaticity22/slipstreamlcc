import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, BookOpen, Play, Home } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useGeolocation } from "@/hooks/useGeolocation";
import { usePreferences } from "@/hooks/usePreferences";

const SAMPLE_PLAN = {
  steps: [
    {
      stepNumber: 1,
      title: "Walk to Headingley Lane stop",
      instruction: "Head south on Otley Road for ~3 minutes. Stop A is opposite the cafe.",
      durationMins: 3,
    },
    {
      stepNumber: 2,
      title: "Catch the 72 bus",
      instruction: "Take the 72 toward Leeds City Bus Station. Tap on as you board.",
      durationMins: 22,
    },
    {
      stepNumber: 3,
      title: "Get off at Leeds Bus Station",
      instruction: "Press the bell after Park Square. Exit at the main concourse.",
      durationMins: 1,
    },
    {
      stepNumber: 4,
      title: "Walk to your destination",
      instruction: "5 min walk via Albion Street. You're nearly there!",
      durationMins: 5,
    },
  ],
};

const QuickActions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { prefs } = usePreferences();
  const { position } = useGeolocation();

  const startSampleTrip = async () => {
    if (!user) {
      toast({ title: "Sign in to start a trip" });
      navigate("/profile");
      return;
    }
    const { data, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        from_label: "Headingley",
        to_label: "Leeds City Centre",
        plan_json: SAMPLE_PLAN,
        status: "in_progress",
        current_step_number: 1,
      })
      .select()
      .single();
    if (error || !data) {
      toast({ title: "Couldn't start trip", description: error?.message, variant: "destructive" });
      return;
    }
    navigate(`/trip/${data.id}`);
  };

  const getMeHomeSafe = async () => {
    if (!user) {
      toast({ title: "Sign in to use Get me home safe" });
      navigate("/profile");
      return;
    }
    if (!prefs?.home_destination) {
      toast({ title: "Set your home destination in your profile first" });
      navigate("/profile");
      return;
    }

    const fromLabel = position
      ? `📍 My location (${position.lat.toFixed(4)}, ${position.lng.toFixed(4)})`
      : "📍 My location";

    const { data: trip, error } = await supabase
      .from("trips")
      .insert({
        user_id: user.id,
        from_label: fromLabel,
        to_label: prefs.home_destination,
        status: "in_progress",
        current_step_number: 1,
        plan_json: {
          steps: [
            {
              stepNumber: 1,
              title: `Heading home to ${prefs.home_destination}`,
              instruction: "Stay on the planned route. Check in if anything changes.",
            },
          ],
        },
      })
      .select()
      .single();

    if (error || !trip) {
      toast({ title: "Couldn't start trip", description: error?.message, variant: "destructive" });
      return;
    }

    // Create share token
    const { data: share } = await supabase
      .from("trip_shares")
      .insert({ trip_id: trip.id, user_id: user.id })
      .select()
      .single();

    if (share?.share_token) {
      const shareUrl = `${window.location.origin}/trip/share/${share.share_token}`;

      // Check if user has trusted contacts
      const { data: contacts } = await supabase
        .from("safety_contacts")
        .select("name, phone_or_email")
        .eq("user_id", user.id)
        .limit(1);

      if (contacts && contacts.length > 0) {
        const message = `I'm on my way home. Follow my trip: ${shareUrl}`;
        if (navigator.share) {
          try {
            await navigator.share({ title: "Slipstream trip", text: message, url: shareUrl });
          } catch {
            /* user cancelled */
          }
        } else {
          try {
            await navigator.clipboard.writeText(message);
            toast({ title: "Share link copied", description: `Send it to ${contacts[0].name}` });
          } catch {
            /* ignore */
          }
        }
      }
    }

    navigate(`/trip/${trip.id}`);
  };

  const items = [
    { icon: Play, label: "Start trip", onClick: startSampleTrip, color: "primary" as const },
    { icon: Home, label: "Home safe", onClick: getMeHomeSafe, color: "primary" as const },
    { icon: Shield, label: "Safety", onClick: () => navigate("/safety"), color: "primary" as const },
    { icon: AlertTriangle, label: "Help now", onClick: () => navigate("/help"), color: "destructive" as const },
    { icon: BookOpen, label: "Glossary", onClick: () => navigate("/glossary"), color: "primary" as const },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-5 grid grid-cols-5 gap-2"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="bg-card border border-border rounded-xl p-2.5 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
            item.color === "destructive" ? "bg-destructive/15" : "bg-primary/15"
          }`}>
            <item.icon className={`w-4 h-4 ${item.color === "destructive" ? "text-destructive" : "text-primary"}`} />
          </div>
          <span className="text-[10px] font-medium text-foreground text-center leading-tight">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
