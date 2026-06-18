import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Home, GraduationCap, Briefcase, ArrowRight, ArrowLeft, Check, Accessibility, Shield, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import Logo from "@/components/Logo";
import { onboardedKey } from "@/components/OnboardingGate";

const STEPS = ["Welcome", "Places", "Destination", "Travel", "Access", "Safety", "Confidence", "Done"] as const;

const DESTINATION_OPTIONS = [
  "Leeds City College (Quarry Hill)",
  "Leeds City College (Printworks)",
  "University of Leeds",
  "Leeds Beckett University",
  "Bradford College",
  "Huddersfield University",
  "Wakefield College",
];

const OnboardingPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { save } = usePreferences();
  const [step, setStep] = useState(0);
  const [home, setHome] = useState("");
  const [school, setSchool] = useState("");
  const [work, setWork] = useState("");
  const [destination, setDestination] = useState("");
  const [destinationQuery, setDestinationQuery] = useState("");
  const [destinationOther, setDestinationOther] = useState("");
  const [routePriority, setRoutePriority] = useState<"fastest" | "cheapest" | "fewest_changes">("fewest_changes");
  const [stepFree, setStepFree] = useState(false);
  const [lowWalking, setLowWalking] = useState(false);
  const [avoidHills, setAvoidHills] = useState(false);
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [confidence, setConfidence] = useState(3);
  const [saving, setSaving] = useState(false);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const filteredDestinations = DESTINATION_OPTIONS.filter((o) =>
    o.toLowerCase().includes(destinationQuery.toLowerCase())
  );

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const places = [
        { label: "Home", address_text: home },
        { label: "School", address_text: school },
        ...(work ? [{ label: "Work", address_text: work }] : []),
      ].filter((p) => p.address_text.trim());
      if (places.length) {
        await supabase.from("places").insert(places.map((p) => ({ ...p, user_id: user.id })));
      }
      if (contactName && contactPhone) {
        await supabase.from("safety_contacts").insert({
          user_id: user.id,
          name: contactName,
          phone_or_email: contactPhone,
        });
      }
      const finalDestination = destination === "__other__" ? destinationOther.trim() : destination;
      await save({
        route_priority: routePriority,
        step_free: stepFree,
        low_walking: lowWalking,
        avoid_hills: avoidHills,
        confidence_level: confidence,
        onboarded: true,
        home_destination: finalDestination || null,
      });
      try { localStorage.setItem(onboardedKey(user.id), "1"); } catch { /* ignore */ }
      toast({ title: "You're all set!", description: "Welcome to Slipstream." });
      navigate("/", { replace: true });
    } catch (e) {
      toast({ title: "Couldn't save", description: e instanceof Error ? e.message : "Try again", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const skip = async () => {
    await save({ onboarded: true });
    if (user) {
      try { localStorage.setItem(onboardedKey(user.id), "1"); } catch { /* ignore */ }
    }
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="max-w-lg mx-auto w-full px-4 pt-6 pb-24 flex-1 flex flex-col">
        <div className="flex gap-1 mb-6">
          {STEPS.map((_, i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex-1"
          >
            {step === 0 && (
              <div className="text-center pt-8">
                <div className="mb-8 flex justify-center">
                  <Logo size={160} glow />
                </div>
                <h1 className="text-3xl font-display font-bold text-foreground mb-3">Welcome to Slipstream</h1>
                <p className="text-muted-foreground mb-8 leading-relaxed">
                  Let's set you up in 2 minutes so we can plan trips that work for you — safely.
                </p>
                <Button onClick={next} className="w-full h-12">
                  Let's go <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <button onClick={skip} className="text-sm text-muted-foreground mt-4 underline">
                  Skip for now
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">Your places</h2>
                <p className="text-muted-foreground mb-6">Where do you usually travel between?</p>
                <div className="space-y-4">
                  <div>
                    <Label className="flex items-center gap-2 mb-2"><Home className="w-4 h-4" />Home</Label>
                    <Input value={home} onChange={(e) => setHome(e.target.value)} placeholder="e.g. 12 Oak Street, Leeds" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2"><GraduationCap className="w-4 h-4" />School / College</Label>
                    <Input value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g. Leeds City College" />
                  </div>
                  <div>
                    <Label className="flex items-center gap-2 mb-2"><Briefcase className="w-4 h-4" />Work (optional)</Label>
                    <Input value={work} onChange={(e) => setWork(e.target.value)} placeholder="Optional" />
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-2">
                  <School className="w-6 h-6" /> Where are you studying or working?
                </h2>
                <p className="text-muted-foreground mb-4">We'll pre-fill this as your default destination.</p>
                <Input
                  value={destinationQuery}
                  onChange={(e) => setDestinationQuery(e.target.value)}
                  placeholder="Search…"
                  className="mb-3"
                />
                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {filteredDestinations.map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setDestination(opt)}
                      className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                        destination === opt ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{opt}</span>
                        {destination === opt && <Check className="w-4 h-4 text-primary" />}
                      </div>
                    </button>
                  ))}
                  <button
                    onClick={() => setDestination("__other__")}
                    className={`w-full text-left p-3 rounded-xl border-2 transition-colors ${
                      destination === "__other__" ? "border-primary bg-primary/5" : "border-border bg-card"
                    }`}
                  >
                    <span className="text-sm font-medium">Other</span>
                  </button>
                  {destination === "__other__" && (
                    <Input
                      value={destinationOther}
                      onChange={(e) => setDestinationOther(e.target.value)}
                      placeholder="Type your destination"
                      className="mt-2"
                    />
                  )}
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">How do you like to travel?</h2>
                <p className="text-muted-foreground mb-6">We'll suggest the right kind of route.</p>
                <div className="space-y-3">
                  {[
                    { v: "fewest_changes", t: "Fewest changes", d: "Simpler — fewer interchanges to worry about" },
                    { v: "fastest", t: "Fastest", d: "Get there as quickly as possible" },
                    { v: "cheapest", t: "Cheapest", d: "Save money where you can" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      onClick={() => setRoutePriority(opt.v as typeof routePriority)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-colors ${
                        routePriority === opt.v ? "border-primary bg-primary/5" : "border-border bg-card"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-foreground">{opt.t}</p>
                          <p className="text-sm text-muted-foreground mt-0.5">{opt.d}</p>
                        </div>
                        {routePriority === opt.v && <Check className="w-5 h-5 text-primary" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-2">
                  <Accessibility className="w-6 h-6" /> Accessibility
                </h2>
                <p className="text-muted-foreground mb-6">We'll only suggest routes that work for you.</p>
                <div className="space-y-2">
                  {[
                    { v: stepFree, set: setStepFree, t: "Step-free routes only", d: "No stairs or escalators" },
                    { v: lowWalking, set: setLowWalking, t: "Less walking", d: "Prefer routes with shorter walks" },
                    { v: avoidHills, set: setAvoidHills, t: "Avoid steep hills", d: "Flatter routes when possible" },
                  ].map((opt, i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border">
                      <div className="flex-1">
                        <p className="font-semibold text-foreground">{opt.t}</p>
                        <p className="text-sm text-muted-foreground">{opt.d}</p>
                      </div>
                      <Switch checked={opt.v} onCheckedChange={opt.set} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 5 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2 flex items-center gap-2">
                  <Shield className="w-6 h-6" /> Trusted contact
                </h2>
                <p className="text-muted-foreground mb-6">Add someone we can help you reach if you need it. You can add more later.</p>
                <div className="space-y-4">
                  <div>
                    <Label className="mb-2 block">Name</Label>
                    <Input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Mum, Dad, Aunt Sue" />
                  </div>
                  <div>
                    <Label className="mb-2 block">Phone or email</Label>
                    <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="07700 900 000" />
                  </div>
                  <p className="text-xs text-muted-foreground">Optional — you can skip this step.</p>
                </div>
              </div>
            )}

            {step === 6 && (
              <div>
                <h2 className="text-2xl font-display font-bold mb-2">How confident are you?</h2>
                <p className="text-muted-foreground mb-6">We'll adjust how much guidance to give you.</p>
                <div className="bg-card rounded-xl p-6 border border-border">
                  <div className="flex justify-between text-xs text-muted-foreground mb-3">
                    <span>New traveller</span>
                    <span>Confident</span>
                  </div>
                  <Slider value={[confidence]} onValueChange={([v]) => setConfidence(v)} min={1} max={5} step={1} />
                  <p className="text-center text-sm text-foreground mt-4 font-medium">
                    {confidence === 1 && "I'm new — give me lots of help"}
                    {confidence === 2 && "Still learning the ropes"}
                    {confidence === 3 && "Getting the hang of it"}
                    {confidence === 4 && "Pretty confident"}
                    {confidence === 5 && "I travel a lot — keep it brief"}
                  </p>
                </div>
              </div>
            )}

            {step === 7 && (
              <div className="text-center pt-12">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-6">
                  <Check className="w-10 h-10 text-primary-foreground" />
                </div>
                <h1 className="text-3xl font-display font-bold mb-3">You're ready</h1>
                <p className="text-muted-foreground mb-8">
                  Your preferences are saved. You can change them anytime in Profile → Settings.
                </p>
                <Button onClick={finish} disabled={saving} className="w-full h-12">
                  {saving ? "Saving..." : "Start using Slipstream"}
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step > 0 && step < STEPS.length - 1 && (
          <div className="flex gap-3 mt-8">
            <Button variant="outline" onClick={back} className="flex-1">
              <ArrowLeft className="w-4 h-4 mr-2" /> Back
            </Button>
            <Button onClick={next} className="flex-1">
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingPage;
