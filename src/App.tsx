import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import AiChat from "@/components/AiChat";
import Index from "./pages/Index";
import RoutesPage from "./pages/RoutesPage";
import LivePage from "./pages/LivePage";
import PointsPage from "./pages/PointsPage";
import LearnPage from "./pages/LearnPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/routes" element={<RoutesPage />} />
          <Route path="/live" element={<LivePage />} />
          <Route path="/points" element={<PointsPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <AiChat />
        <BottomNav />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
