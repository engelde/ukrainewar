"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQueryState, parseAsString } from "nuqs";
import type { CasualtyData, MapLayers, EquipmentMarker } from "@/lib/types";
import StatsOverlay from "@/components/stats/StatsOverlay";
import Header, { Footer } from "@/components/layout/Header";
import LayerControls from "@/components/map/LayerControls";
import DetailPanel from "@/components/map/DetailPanel";
import TimelineScrubber from "@/components/map/TimelineScrubber";
import HumanitarianPanel from "@/components/humanitarian/HumanitarianPanel";
import SpendingPanel from "@/components/spending/SpendingPanel";
import { MAJOR_BATTLES } from "@/data/battles";
import DraggablePanel from "@/components/ui/DraggablePanel";
import ResetButton from "@/components/layout/ResetButton";

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
  // URL state — timeline date persisted in query string
  const [urlDate, setUrlDate] = useQueryState("t", parseAsString.withOptions({ shallow: true, throttleMs: 500 }));

  const [layers, setLayers] = useState<MapLayers>({
    territory: true,
    equipment: true,
    frontline: true,
    border: true,
    conflicts: true,
    heatmap: true,
    battles: true,
  });

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(
    null
  );

  const [territoryDate, setTerritoryDate] = useState<string | null>(urlDate);
  const [humanitarianOpen, setHumanitarianOpen] = useState(true);
  const [spendingOpen, setSpendingOpen] = useState(true);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(false);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);

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
    // Sync to URL — use today's date as sentinel to clear param
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    if (date >= todayStr) {
      setUrlDate(null);
    } else {
      setUrlDate(date);
    }
  }, [setUrlDate]);

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

  const handleToggleSpending = useCallback(() => {
    setSpendingOpen((prev) => !prev);
  }, []);

  // Reset everything to defaults
  const handleReset = useCallback(() => {
    setTerritoryDate(null);
    setUrlDate(null);
    setFlyToTarget(null);
    setSelectedMarker(null);
    setHumanitarianOpen(true);
    setSpendingOpen(true);
    setStatsCollapsed(false);
    setLayersCollapsed(false);
    setTimelineKey(prev => prev + 1);
    setLayers({
      territory: true,
      equipment: true,
      frontline: true,
      border: true,
      conflicts: true,
      heatmap: true,
      battles: true,
    });
  }, [setUrlDate]);

  // Use historical data when timeline is scrubbed to a past date
  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const isViewingPast = !!territoryDate && territoryDate < todayStr;
  const displayData = (isViewingPast && historicalData) ? historicalData : casualtyData;

  const warDay = (() => {
    const start = new Date(2022, 1, 24); // Feb 24, 2022
    const current = territoryDate
      ? new Date(parseInt(territoryDate.slice(0, 4)), parseInt(territoryDate.slice(4, 6)) - 1, parseInt(territoryDate.slice(6, 8)))
      : new Date();
    return Math.floor((current.getTime() - start.getTime()) / 86400000) + 1;
  })();

  return (
    <main className="relative h-screen w-screen overflow-hidden">
      <MapView
        layers={layers}
        onMarkerClick={handleMarkerClick}
        territoryDate={territoryDate}
        battles={MAJOR_BATTLES}
        flyTo={flyToTarget}
      />
      <Header />
      <ResetButton onReset={handleReset} warDay={warDay} isHistorical={isViewingPast} />

      {/* Expanded panels — draggable */}
      {displayData && !statsCollapsed && (
        <DraggablePanel className="fixed right-4 top-14 z-30 sm:right-6 sm:top-16 max-w-[calc(100vw-2rem)] sm:max-w-xs">
          <StatsOverlay
            data={displayData}
            isHistorical={isViewingPast && !!historicalData}
            collapsed={false}
            onCollapse={() => setStatsCollapsed(true)}
          />
        </DraggablePanel>
      )}
      {!layersCollapsed && (
        <DraggablePanel className="fixed left-4 bottom-[165px] z-30 sm:left-6 sm:bottom-[270px]">
          <LayerControls
            layers={layers}
            onToggle={handleToggleLayer}
            collapsed={false}
            onCollapse={() => setLayersCollapsed(true)}
          />
        </DraggablePanel>
      )}
      {selectedMarker && (
        <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />
      )}
      {humanitarianOpen && (
        <DraggablePanel className="fixed left-4 top-14 z-30 sm:left-6 sm:top-16 max-w-[calc(100vw-2rem)] sm:max-w-xs">
          <HumanitarianPanel
            isOpen={true}
            onToggle={handleToggleHumanitarian}
            timelineDate={territoryDate ?? undefined}
          />
        </DraggablePanel>
      )}
      {spendingOpen && (
        <DraggablePanel className="fixed left-4 top-[280px] z-30 sm:left-[303px] sm:top-16 max-w-[calc(100vw-2rem)] sm:max-w-xs">
          <SpendingPanel
            isOpen={true}
            onToggle={handleToggleSpending}
            timelineDate={territoryDate ?? undefined}
          />
        </DraggablePanel>
      )}

      <TimelineScrubber
        key={timelineKey}
        onDateChange={handleTimelineDateChange}
        initialDate={urlDate}
        dockSlot={
          (statsCollapsed || !humanitarianOpen || !spendingOpen || layersCollapsed) ? (
            <>
              {statsCollapsed && displayData && (
                <StatsOverlay
                  data={displayData}
                  isHistorical={isViewingPast && !!historicalData}
                  collapsed={true}
                  onExpand={() => setStatsCollapsed(false)}
                />
              )}
              {!humanitarianOpen && (
                <HumanitarianPanel
                  isOpen={false}
                  onToggle={handleToggleHumanitarian}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {!spendingOpen && (
                <SpendingPanel
                  isOpen={false}
                  onToggle={handleToggleSpending}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {layersCollapsed && (
                <LayerControls
                  layers={layers}
                  onToggle={handleToggleLayer}
                  collapsed={true}
                  onExpand={() => setLayersCollapsed(false)}
                />
              )}
            </>
          ) : undefined
        }
      />

      <Footer />
    </main>
  );
}
