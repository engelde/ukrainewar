"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import dynamic from "next/dynamic";
import { useQueryState, parseAsString, parseAsFloat } from "nuqs";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/constants";
import type { CasualtyData, MapLayers, EquipmentMarker } from "@/lib/types";
import StatsOverlay from "@/components/stats/StatsOverlay";
import Header, { Footer } from "@/components/layout/Header";
import LayerControls from "@/components/map/LayerControls";
import DetailPanel from "@/components/map/DetailPanel";
import TimelineScrubber from "@/components/map/TimelineScrubber";
import HumanitarianPanel from "@/components/humanitarian/HumanitarianPanel";
import SpendingPanel from "@/components/spending/SpendingPanel";
import EventSidebar from "@/components/layout/EventSidebar";
import { MAJOR_BATTLES } from "@/data/battles";
import DraggablePanel from "@/components/ui/DraggablePanel";
import ResetButton from "@/components/layout/ResetButton";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();
  const [urlDate, setUrlDate] = useQueryState("t", parseAsString.withOptions({ shallow: true, throttleMs: 500 }));
  const [urlLng, setUrlLng] = useQueryState("lng", parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }));
  const [urlLat, setUrlLat] = useQueryState("lat", parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }));
  const [urlZoom, setUrlZoom] = useQueryState("z", parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }));

  const [layers, setLayers] = useState<MapLayers>({
    territory: true,
    equipment: true,
    frontline: true,
    border: true,
    conflicts: true,
    heatmap: true,
    battles: true,
  });

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(null);
  const [territoryDate, setTerritoryDate] = useState<string | null>(urlDate);
  const [humanitarianOpen, setHumanitarianOpen] = useState(false);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<{ lat: number; lng: number; zoom?: number } | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Open panels on desktop after first render
  useEffect(() => {
    if (!isMobile) {
      setHumanitarianOpen(true);
      setSpendingOpen(true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    if (date >= todayStr) {
      setUrlDate(null);
    } else {
      setUrlDate(date);
    }
  }, [setUrlDate]);

  useEffect(() => {
    if (fetchControllerRef.current) {
      fetchControllerRef.current.abort();
    }
    if (!territoryDate) {
      lastFetchedDate.current = null;
      return;
    }
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    if (territoryDate >= todayStr) {
      lastFetchedDate.current = null;
      return;
    }
    if (lastFetchedDate.current === territoryDate) return;

    const controller = new AbortController();
    fetchControllerRef.current = controller;
    const dateToFetch = territoryDate;

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/casualties/history?date=${dateToFetch}`, {
          signal: controller.signal,
        });
        if (res.ok && !controller.signal.aborted) {
          const data = await res.json();
          lastFetchedDate.current = dateToFetch;
          setHistoricalData(data);
        }
      } catch {
        // Aborted or failed
      }
    }, 30);

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

  const handleMapMoveEnd = useCallback((center: [number, number], zoom: number) => {
    const [lng, lat] = center;
    const roundedLng = Math.round(lng * 100) / 100;
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedZoom = Math.round(zoom * 10) / 10;

    // Only store in URL if different from defaults
    const isDefaultLng = Math.abs(roundedLng - MAP_CENTER[0]) < 0.1;
    const isDefaultLat = Math.abs(roundedLat - MAP_CENTER[1]) < 0.1;
    const isDefaultZoom = Math.abs(roundedZoom - MAP_ZOOM) < 0.2;

    setUrlLng(isDefaultLng ? null : roundedLng);
    setUrlLat(isDefaultLat ? null : roundedLat);
    setUrlZoom(isDefaultZoom ? null : roundedZoom);
  }, [setUrlLng, setUrlLat, setUrlZoom]);

  const handleEventClick = useCallback((date: string) => {
    handleTimelineDateChange(date);
  }, [handleTimelineDateChange]);

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    setTerritoryDate(null);
    setUrlDate(null);
    setUrlLng(null);
    setUrlLat(null);
    setUrlZoom(null);
    setFlyToTarget(null);
    setSelectedMarker(null);
    setHumanitarianOpen(true);
    setSpendingOpen(true);
    setStatsCollapsed(false);
    setLayersCollapsed(false);
    setTimelineKey(prev => prev + 1);
    setSidebarOpen(false);
    setLayers({
      territory: true,
      equipment: true,
      frontline: true,
      border: true,
      conflicts: true,
      heatmap: true,
      battles: true,
    });
  }, [setUrlDate, setUrlLng, setUrlLat, setUrlZoom]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const isViewingPast = !!territoryDate && territoryDate < todayStr;
  const displayData = isViewingPast ? (historicalData ?? casualtyData) : casualtyData;

  const warDay = (() => {
    const start = new Date(2022, 1, 24);
    const current = territoryDate
      ? new Date(parseInt(territoryDate.slice(0, 4)), parseInt(territoryDate.slice(4, 6)) - 1, parseInt(territoryDate.slice(6, 8)))
      : new Date();
    return Math.floor((current.getTime() - start.getTime()) / 86400000) + 1;
  })();

  return (
    <SidebarProvider defaultOpen={false} open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <EventSidebar
        onEventClick={handleEventClick}
        currentDate={territoryDate}
      />
      <SidebarInset className="relative h-screen overflow-hidden">
        <MapView
          layers={layers}
          onMarkerClick={handleMarkerClick}
          onMoveEnd={handleMapMoveEnd}
          territoryDate={territoryDate}
          battles={MAJOR_BATTLES}
          flyTo={flyToTarget}
          initialCenter={urlLng != null && urlLat != null ? [urlLng, urlLat] : undefined}
          initialZoom={urlZoom ?? undefined}
        />
        <Header />
        <ResetButton onReset={handleReset} warDay={warDay} isHistorical={isViewingPast} />

        {displayData && !statsCollapsed && (
          <DraggablePanel className="fixed right-4 top-14 z-30 sm:right-6 sm:top-16 max-w-xs">
            <StatsOverlay
              data={displayData}
              isHistorical={isViewingPast && !!historicalData}
              collapsed={false}
              onCollapse={() => setStatsCollapsed(true)}
            />
          </DraggablePanel>
        )}
        {!layersCollapsed && (
          <DraggablePanel className="fixed left-4 bottom-[155px] z-30 sm:left-6 sm:bottom-[240px]">
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
          <DraggablePanel className="fixed left-4 top-14 z-30 sm:left-6 sm:top-16 max-w-xs">
            <HumanitarianPanel
              isOpen={true}
              onToggle={handleToggleHumanitarian}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {spendingOpen && (
          <DraggablePanel className="fixed left-4 top-[280px] z-30 sm:left-[303px] sm:top-16 max-w-xs">
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
          eventsOpen={sidebarOpen}
          onToggleEvents={handleToggleSidebar}
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
      </SidebarInset>
    </SidebarProvider>
  );
}
