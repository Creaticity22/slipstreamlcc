import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import BottomNav from "@/components/BottomNav";
import AiChat from "@/components/AiChat";
import OnboardingGate from "@/components/OnboardingGate";
import AuthGate from "@/components/AuthGate";
import InstallPrompt from "@/components/InstallPrompt";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import RoutesPage from "./pages/RoutesPage";
import LivePage from "./pages/LivePage";
import PointsPage from "./pages/PointsPage";
import LearnPage from "./pages/LearnPage";
import ProfilePage from "./pages/ProfilePage";
import OnboardingPage from "./pages/OnboardingPage";
import SafetyPage from "./pages/SafetyPage";
import HelpNowPage from "./pages/HelpNowPage";
import GlossaryPage from "./pages/GlossaryPage";
import TripPage from "./pages/TripPage";
import TripSharePage from "./pages/TripSharePage";
import HistoryPage from "./pages/HistoryPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import TrustPage from "./pages/TrustPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const Chrome = () => {
  const location = useLocation();
  const { user } = useAuth();
  const hideChrome =
    !user ||
    location.pathname.startsWith("/trip/share/") ||
    location.pathname === "/onboarding";
  if (hideChrome) return null;
  return (
    <>
      <AiChat />
      <BottomNav />
      <InstallPrompt />
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <OnboardingGate />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/routes" element={<RoutesPage />} />
            <Route path="/live" element={<LivePage />} />
            <Route path="/points" element={<PointsPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/safety" element={<SafetyPage />} />
            <Route path="/help" element={<HelpNowPage />} />
            <Route path="/glossary" element={<GlossaryPage />} />
            <Route path="/trip/:tripId" element={<TripPage />} />
            <Route path="/trip/share/:token" element={<TripSharePage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/trust" element={<TrustPage />} />
            <Route path="/privacy" element={<TrustPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <Chrome />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
