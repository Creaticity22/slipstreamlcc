import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, AlertTriangle, BusFront, MapPinned, XCircle, ShieldAlert, BatteryLow, Phone, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Scenario {
  id: string;
  icon: typeof BusFront;
  title: string;
  steps: string[];
  reassurance: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "missed",
    icon: BusFront,
    title: "Missed bus or train",
    steps: [
      "Take a breath — it happens to everyone.",
      "Check the next departure on the Live page.",
      "If it's a long wait, look for an alternative route or operator.",
      "Message your trusted contact so they know there's a delay.",
    ],
    reassurance: "Missing one service isn't a problem. The next one is usually within 15 minutes on busy routes.",
  },
  {
    id: "wrong-stop",
    icon: MapPinned,
    title: "Wrong stop or platform",
    steps: [
      "Stay calm and stay where you are if it's safe.",
      "Open the Live page to see your current location.",
      "Tap a nearby bus stop to get walking directions to the right one.",
      "If you're at a station, ask staff at the help point — they expect this question every day.",
    ],
    reassurance: "Getting on the wrong service is very common. Staff at staffed stations help with this constantly.",
  },
  {
    id: "cancelled",
    icon: XCircle,
    title: "Service cancelled",
    steps: [
      "Look for the next departure on the same route.",
      "Check Live for buses on parallel routes going the same way.",
      "If it's late, head to a staffed station or busy bus stop and wait there.",
      "Let your trusted contact know you'll be later than planned.",
    ],
    reassurance: "Most operators run replacement services or apologise on the next ticket. You won't be stranded.",
  },
  {
    id: "unsafe",
    icon: ShieldAlert,
    title: "I feel unsafe",
    steps: [
      "Move to a busy, well-lit area — the front of the bus, near the driver, or the staffed part of a station.",
      "On a train: walk to the next carriage. Bus: sit closer to the driver.",
      "Text 61016 (BTP) on trains, or 999 if it's an emergency.",
      "Open the share-trip page and send the link to your trusted contact so they know where you are.",
    ],
    reassurance: "Trust your instincts. You don't need a 'good reason' to move seats or get off at the next stop. The driver and staff are there to help.",
  },
  {
    id: "battery",
    icon: BatteryLow,
    title: "Phone dead or low battery",
    steps: [
      "Memorise your next 1–2 steps before the screen goes off.",
      "Look for free charging at staffed stations, big shops, or coffee places.",
      "Most ticket machines and bus drivers can tell you the next stop or service.",
      "If you're meant to meet someone, head to your usual meeting spot — they'll guess that.",
    ],
    reassurance: "You don't need your phone to get home. The transport network worked for decades without one — staff and signs will guide you.",
  },
];

const HelpNowPage = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-display font-bold flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-destructive" /> Help now
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Pick what's happening — we'll talk you through it.</p>
        </motion.div>

        {/* Emergency CTA */}
        <a
          href="tel:999"
          className="w-full bg-destructive text-destructive-foreground rounded-2xl p-4 mb-6 font-semibold flex items-center justify-between"
        >
          <span className="flex items-center gap-2"><Phone className="w-5 h-5" /> Emergency? Call 999</span>
          <ChevronRight className="w-5 h-5" />
        </a>

        <div className="space-y-2">
          {SCENARIOS.map((s) => {
            const isOpen = open === s.id;
            const Icon = s.icon;
            return (
              <div key={s.id} className="bg-card rounded-xl border border-border overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : s.id)}
                  className="w-full flex items-center gap-3 p-4 text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <p className="flex-1 font-semibold">{s.title}</p>
                  <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${isOpen ? "rotate-90" : ""}`} />
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 border-t border-border">
                        <p className="text-sm text-muted-foreground italic mt-3 mb-4">{s.reassurance}</p>
                        <ol className="space-y-2.5">
                          {s.steps.map((step, i) => (
                            <li key={i} className="flex gap-3">
                              <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                                {i + 1}
                              </span>
                              <span className="text-sm leading-relaxed">{step}</span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        <div className="mt-6 bg-card rounded-xl p-4 border border-border">
          <p className="text-sm font-semibold mb-1">Useful numbers</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>Emergency: <a className="text-primary" href="tel:999">999</a></li>
            <li>British Transport Police text: <a className="text-primary" href="sms:61016">61016</a></li>
            <li>Non-emergency police: <a className="text-primary" href="tel:101">101</a></li>
            <li>Samaritans: <a className="text-primary" href="tel:116123">116 123</a></li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default HelpNowPage;
