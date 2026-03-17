"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type { CasualtyData, MapLayers, EquipmentMarker } from "@/lib/types";
import StatsOverlay from "@/components/stats/StatsOverlay";
import Header, { Footer } from "@/components/layout/Header";
import LayerControls from "@/components/map/LayerControls";
import DetailPanel from "@/components/map/DetailPanel";
import TimelineScrubber from "@/components/map/TimelineScrubber";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => (
    <div className="fixed inset-0 z-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-ua-blue border-t-transparent" />
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    </div>
  ),
});

interface AppShellProps {
  casualtyData: CasualtyData | null;
}

export default function AppShell({ casualtyData }: AppShellProps) {
  const [layers, setLayers] = useState<MapLayers>({
    territory: true,
    equipment: true,
    frontline: true,
  });

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(
    null
  );

  const [timelineOpen, setTimelineOpen] = useState(false);
  const [territoryDate, setTerritoryDate] = useState<string | null>(null);

  const handleToggleLayer = useCallback((layer: keyof MapLayers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  }, []);

  const handleMarkerClick = useCallback((marker: EquipmentMarker) => {
    setSelectedMarker(marker);
  }, []);

  const handleCloseDetail = useCallback(() => {
    setSelectedMarker(null);
  }, []);

  const handleTimelineDateChange = useCallback((date: string) => {
    setTerritoryDate(date);
  }, []);

  const handleTimelineClose = useCallback(() => {
    setTimelineOpen(false);
    setTerritoryDate(null); // Reset to latest
  }, []);

  const handleTimelineOpen = useCallback(() => {
    setTimelineOpen(true);
  }, []);

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapView
        layers={layers}
        onMarkerClick={handleMarkerClick}
        territoryDate={territoryDate}
      />
      <Header />
      {casualtyData && <StatsOverlay data={casualtyData} />}
      <LayerControls
        layers={layers}
        onToggle={handleToggleLayer}
        onOpenTimeline={handleTimelineOpen}
        timelineOpen={timelineOpen}
      />
      {selectedMarker && (
        <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />
      )}
      {timelineOpen && (
        <TimelineScrubber
          onDateChange={handleTimelineDateChange}
          onClose={handleTimelineClose}
        />
      )}
      <Footer />
    </main>
  );
}
