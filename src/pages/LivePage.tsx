import { useState } from "react";
import { motion } from "framer-motion";
import LiveDepartures from "@/components/LiveDepartures";
import LiveMap from "@/components/LiveMap";
import { MapPin, List, Map as MapIcon } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const LivePage = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="max-w-lg mx-auto px-4 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-5"
        >
          <h1 className="text-2xl font-display font-bold text-foreground">Live updates ⏱️</h1>
          <div className="flex items-center gap-1.5 mt-1">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <p className="text-sm text-muted-foreground">Near Headingley Lane</p>
          </div>
        </motion.div>

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
            <LiveDepartures />
          </TabsContent>
          <TabsContent value="map">
            <LiveMap />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default LivePage;
