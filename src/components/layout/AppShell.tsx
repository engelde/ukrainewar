"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import type { CasualtyData, MapLayers, EquipmentMarker } from "@/lib/types";
import StatsOverlay from "@/components/stats/StatsOverlay";
import Header, { Footer } from "@/components/layout/Header";
import LayerControls from "@/components/map/LayerControls";
import DetailPanel from "@/components/map/DetailPanel";
import TimelineScrubber from "@/components/map/TimelineScrubber";
import HumanitarianPanel from "@/components/humanitarian/HumanitarianPanel";
import DataSourcesPanel from "@/components/layout/DataSourcesPanel";
import DraggablePanel from "@/components/ui/DraggablePanel";

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
    border: true,
  });

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(
    null
  );

  const [territoryDate, setTerritoryDate] = useState<string | null>(null);
  const [humanitarianOpen, setHumanitarianOpen] = useState(true);

  // Historical casualty data for timeline scrubbing
  const [historicalData, setHistoricalData] = useState<CasualtyData | null>(null);
  const fetchControllerRef = useRef<AbortController | null>(null);
  const lastFetchedDate = useRef<string | null>(null);

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

  // Fetch historical loss data when timeline date changes
  useEffect(() => {
    // Abort previous request
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }

    if (!territoryDate) {
      lastFetchedDate.current = null;
      return;
    }

    // Check if we're on the latest date (today) — use live data
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    if (territoryDate >= todayStr) {
      lastFetchedDate.current = null;
      return;
    }

    // Debounce: don't fetch if same date
    if (lastFetchedDate.current === territoryDate) return;
    lastFetchedDate.current = territoryDate;

    const controller = new AbortController();
    fetchControllerRef.current = controller;

    // Small delay to debounce rapid scrubbing
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/casualties/history?date=${territoryDate}`, {
          signal: controller.signal,
        });
        if (res.ok && !controller.signal.aborted) {
          const data = await res.json();
          setHistoricalData(data);
        }
      } catch {
        // Aborted or failed — ignore
      }
    }, 150);

    return () => {
      clearTimeout(timer);
    };
  }, [territoryDate]);

  const handleToggleHumanitarian = useCallback(() => {
    setHumanitarianOpen((prev) => !prev);
  }, []);

  // Use historical data when timeline is scrubbed to a past date
  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const isViewingPast = !!territoryDate && territoryDate < todayStr;
  const displayData = (isViewingPast && historicalData) ? historicalData : casualtyData;

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapView
        layers={layers}
        onMarkerClick={handleMarkerClick}
        territoryDate={territoryDate}
      />
      <Header />
      {displayData && (
        <DraggablePanel className="fixed right-4 top-14 z-30 sm:right-6 sm:top-16 max-w-[calc(100vw-2rem)] sm:max-w-xs">
          <StatsOverlay data={displayData} isHistorical={isViewingPast && !!historicalData} />
        </DraggablePanel>
      )}
      <DraggablePanel className="fixed left-4 bottom-[175px] z-30 sm:left-6 sm:bottom-[185px]">
        <LayerControls
          layers={layers}
          onToggle={handleToggleLayer}
        />
      </DraggablePanel>
      {selectedMarker && (
        <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />
      )}
      <DraggablePanel className="fixed left-4 top-14 z-30 sm:left-6 sm:top-16 max-w-[calc(100vw-2rem)] sm:max-w-xs">
        <HumanitarianPanel
          isOpen={humanitarianOpen}
          onToggle={handleToggleHumanitarian}
        />
      </DraggablePanel>
      <TimelineScrubber
        onDateChange={handleTimelineDateChange}
      />
      <DraggablePanel className="fixed left-4 bottom-[140px] z-40 sm:left-6 sm:bottom-[150px]">
        <DataSourcesPanel />
      </DraggablePanel>
      <Footer />
    </main>
  );
}
