import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, AlertTriangle, BookOpen, Play } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

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

  const items = [
    { icon: Play, label: "Start trip", onClick: startSampleTrip, color: "primary" },
    { icon: Shield, label: "Safety", onClick: () => navigate("/safety"), color: "primary" },
    { icon: AlertTriangle, label: "Help now", onClick: () => navigate("/help"), color: "destructive" },
    { icon: BookOpen, label: "Glossary", onClick: () => navigate("/glossary"), color: "primary" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="mt-5 grid grid-cols-4 gap-2"
    >
      {items.map((item) => (
        <button
          key={item.label}
          onClick={item.onClick}
          className="bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            item.color === "destructive" ? "bg-destructive/15" : "bg-primary/15"
          }`}>
            <item.icon className={`w-5 h-5 ${item.color === "destructive" ? "text-destructive" : "text-primary"}`} />
          </div>
          <span className="text-[11px] font-medium text-foreground">{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
