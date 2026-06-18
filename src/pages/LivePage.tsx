import LiveDepartures from "@/components/LiveDepartures";
import LiveMap from "@/components/LiveMap";
import { MapPin, List, Map as MapIcon, Locate, Loader2, Stethoscope } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useGeolocation } from "@/hooks/useGeolocation";
import BrandHeader from "@/components/BrandHeader";
import { BodsProxyAuthError, callBodsProxy } from "@/services/bodsProxyClient";
import { toast } from "sonner";

const LivePage = () => {
  const geo = useGeolocation(true);
  const bbox = geo.toBbox(10);

  const checkBodsHealth = async () => {
    try {
      const data = await callBodsProxy<Record<string, unknown>>({ endpoint: "health" });
      toast.success("BODS health check", {
        description: JSON.stringify(data, null, 2),
        duration: 8000,
      });
    } catch (e: any) {
      toast.error("BODS health check failed", {
        description: e instanceof BodsProxyAuthError ? "Sign in before running the health check" : e?.message || "Unknown error",
        duration: 8000,
      });
    }
  };


  const locationLabel = geo.error
    ? "Using default location"
    : geo.loading
    ? "Finding you…"
    : "Near your location";

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-5">
        <BrandHeader
          title="Live updates "
          subtitle={
            <span className="flex items-center gap-1.5">
              {geo.loading ? (
                <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
              ) : (
                <MapPin className="w-3.5 h-3.5 text-primary" />
              )}
              {locationLabel}
              {!geo.loading && (
                <button onClick={geo.refresh} className="ml-1 p-0.5 rounded hover:bg-muted" aria-label="Re-locate">
                  <Locate className="w-3 h-3 text-muted-foreground" />
                </button>
              )}
            </span>
          }
        />

        {import.meta.env.DEV && (
          <button
            onClick={checkBodsHealth}
            className="mb-3 flex items-center gap-2 rounded-md bg-coral/10 px-3 py-2 text-sm font-medium text-coral hover:bg-coral/20 transition-colors"
          >
            <Stethoscope className="w-4 h-4" />
            Check BODS health
          </button>
        )}

        <Tabs defaultValue="list" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="list" className="flex-1 gap-1.5">
              <List className="w-3.5 h-3.5" />
              List
            </TabsTrigger>
            <TabsTrigger value="map" className="flex-1 gap-1.5">
              <MapIcon className="w-3.5 h-3.5" />
              Map
            </TabsTrigger>
          </TabsList>
          <TabsContent value="list">
            <LiveDepartures userPosition={geo.position} bbox={bbox} />
          </TabsContent>
          <TabsContent value="map">
            <LiveMap userPosition={geo.position} bbox={bbox} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LivePage;
