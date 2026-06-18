import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { usePreferences } from "@/hooks/usePreferences";

export const onboardedKey = (userId: string) => `slipstream:onboarded:${userId}`;

/**
 * Redirects newly signed-in users to /onboarding once.
 * Skipped on share pages, the onboarding page itself, and auth-related pages.
 */
const OnboardingGate = () => {
  const { user, loading: authLoading } = useAuth();
  const { prefs, loading: prefsLoading, refresh } = usePreferences();
  const navigate = useNavigate();
  const location = useLocation();

  // Re-fetch preferences when navigating so a just-finished onboarding is reflected.
  useEffect(() => {
    if (user) refresh();
  }, [location.pathname, user, refresh]);

  useEffect(() => {
    if (authLoading || prefsLoading) return;
    if (!user) return;

    // Never redirect away from the onboarding page itself, or from public pages.
    const skipPaths = ["/onboarding", "/profile"];
    const isSkippable =
      skipPaths.includes(location.pathname) ||
      location.pathname.startsWith("/trip/share/") ||
      location.pathname.startsWith("/trust") ||
      location.pathname.startsWith("/privacy");
    if (isSkippable) return;

    // Local short-circuit: if we marked this user as onboarded in this browser,
    // trust it even if the prefs row hasn't propagated to this hook yet.
    try {
      if (localStorage.getItem(onboardedKey(user.id)) === "1") return;
    } catch {
      /* ignore */
    }

    if (prefs && !prefs.onboarded) {
      navigate("/onboarding", { replace: true });
    }

    // Keep localStorage in sync once we see a truthy server value.
    if (prefs?.onboarded) {
      try {
        localStorage.setItem(onboardedKey(user.id), "1");
      } catch {
        /* ignore */
      }
    }
  }, [user, prefs, authLoading, prefsLoading, location.pathname, navigate]);

  return null;
};

export default OnboardingGate;
