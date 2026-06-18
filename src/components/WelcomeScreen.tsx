import { useState } from "react";
import { motion } from "framer-motion";
import { Trophy, Heart, MessageCircle, Zap, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { signInAsDemo } from "@/hooks/useAuth";
import { lovable } from "@/integrations/lovable/index";
import BrandHeader from "@/components/BrandHeader";

const WelcomeScreen = () => {
  const [demoLoading, setDemoLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) console.error("Sign-in error:", error);
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    const { error } = await signInAsDemo();
    if (error) {
      toast.error("Demo unavailable", { description: "Please try signing in manually." });
    }
    setDemoLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-start justify-center">
      <div className="w-full max-w-lg px-4 pt-5 pb-10">
        <BrandHeader
          title="Join Slipstream"
          subtitle="Your smarter way to school & college across West Yorkshire"
        />

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl shadow-card p-5 space-y-4 border border-border"
        >
          {/* Demo button up top so it's visible without scrolling */}
          <div className="space-y-2">
            <button
              onClick={handleDemoLogin}
              disabled={demoLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-primary text-primary-foreground font-semibold py-3.5 px-4 rounded-2xl shadow-lg text-base hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {demoLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Zap className="w-5 h-5" />
              )}
              Try the demo — no sign up needed
            </button>
            <p className="text-[11px] text-muted-foreground text-center">
              Pre-loaded with journeys, CO₂ stats &amp; a streak
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground">or sign in with your account</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleGoogleSignIn}
            className="w-full bg-foreground text-background font-display font-semibold py-3 rounded-xl flex items-center justify-center gap-3 text-base"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </motion.button>

          <div className="pt-2 space-y-2.5">
            {[
              { icon: Trophy, text: "Track your Slipstream Points & badges", color: "text-slipstream-gold" },
              { icon: Heart, text: "Save favourite routes for quick access", color: "text-slipstream-coral" },
              { icon: MessageCircle, text: "Keep your chat history with the AI assistant", color: "text-slipstream-teal" },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <item.icon className={`w-4 h-4 shrink-0 ${item.color}`} />
                <span className="text-xs text-muted-foreground">{item.text}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default WelcomeScreen;
