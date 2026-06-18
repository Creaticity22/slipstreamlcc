import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const SKIP_PATHS = ["/onboarding", "/profile", "/trust", "/privacy"];

const OnboardingGate = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading || !user) return;
    if (SKIP_PATHS.some((p) => location.pathname.startsWith(p))) return;
    if (location.pathname.startsWith("/trip/share/")) return;

    const lsKey = `slipstream:onboarded:${user.id}`;
    try {
      if (localStorage.getItem(lsKey) === "1") return;
    } catch {
      /* ignore */
    }

    supabase
      .from("profiles")
      .select("onboarded")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.onboarded) {
          try {
            localStorage.setItem(lsKey, "1");
          } catch {
            /* ignore */
          }
        } else {
          navigate("/onboarding", { replace: true });
        }
      });
  }, [user, loading, location.pathname, navigate]);

  return null;
};

export default OnboardingGate;
