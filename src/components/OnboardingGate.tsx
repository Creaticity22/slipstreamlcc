import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";

/**
 * Redirects newly signed-in users to /onboarding once.
 * Skipped on share pages, the onboarding page itself, and auth-related pages.
 */
const OnboardingGate = () => {
  const { user, loading: authLoading } = useAuth();
  const { prefs, loading: prefsLoading } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (authLoading || prefsLoading) return;
    if (!user || !prefs) return;

    const skipPaths = ["/onboarding", "/profile"];
    const isSkippable =
      skipPaths.includes(location.pathname) ||
      location.pathname.startsWith("/trip/share/");
    if (isSkippable) return;

    if (!prefs.onboarded) {
      navigate("/onboarding", { replace: true });
    }
  }, [user, prefs, authLoading, prefsLoading, location.pathname, navigate]);

  return null;
};

export default OnboardingGate;
