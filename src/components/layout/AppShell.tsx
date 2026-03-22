"use client";

import dynamic from "next/dynamic";
import { parseAsBoolean, parseAsFloat, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import HumanitarianPanel from "@/components/humanitarian/HumanitarianPanel";
import DayTracker from "@/components/layout/DayTracker";
import EventSidebar from "@/components/layout/EventSidebar";
import Header, { Footer } from "@/components/layout/Header";
import DetailPanel from "@/components/map/DetailPanel";
import LayerControls from "@/components/map/LayerControls";
import TimelineScrubber from "@/components/map/TimelineScrubber";
import SpendingPanel from "@/components/spending/SpendingPanel";
import StatsOverlay from "@/components/stats/StatsOverlay";
import DraggablePanel from "@/components/ui/DraggablePanel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { MAJOR_BATTLES } from "@/data/battles";
import { BELARUS_BASES } from "@/data/belarus-bases";
import { GAS_PIPELINES, GAS_STATIONS, POWER_PLANTS } from "@/data/energy-assets";
import { BRIDGES, DAMS, PORTS } from "@/data/infrastructure";
import { NATO_BASES } from "@/data/nato-bases";
import { NUCLEAR_PLANTS } from "@/data/nuclear-plants";
import { MAJOR_OPERATIONS } from "@/data/operations";
import { useIsMobile } from "@/hooks/use-mobile";
import { useEvents } from "@/hooks/useEvents";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/constants";
import type { CasualtyData, EquipmentMarker, MapLayers } from "@/lib/types";

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
  const { events } = useEvents();
  const [urlDate, setUrlDate] = useQueryState(
    "t",
    parseAsString.withOptions({ shallow: true, throttleMs: 500 }),
  );
  const [urlLng, setUrlLng] = useQueryState(
    "lng",
    parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }),
  );
  const [urlLat, setUrlLat] = useQueryState(
    "lat",
    parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }),
  );
  const [urlZoom, setUrlZoom] = useQueryState(
    "z",
    parseAsFloat.withOptions({ shallow: true, throttleMs: 1000 }),
  );
  const [urlEvents, setUrlEvents] = useQueryState(
    "events",
    parseAsBoolean.withOptions({ shallow: true }),
  );

  const [layers, setLayers] = useState<MapLayers>({
    territory: true,
    equipment: true,
    frontline: true,
    border: true,
    conflicts: true,
    heatmap: true,
    battles: true,
    operations: true,
    infrastructure: true,
    nato: true,
    thermal: true,
  });

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(null);
  const [territoryDate, setTerritoryDate] = useState<string | null>(urlDate);
  const [humanitarianOpen, setHumanitarianOpen] = useState(false);
  const [spendingOpen, setSpendingOpen] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);
  const [layersCollapsed, setLayersCollapsed] = useState(true);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(urlEvents === true);

  // Sync sidebar state to URL
  useEffect(() => {
    setUrlEvents(sidebarOpen ? true : null);
  }, [sidebarOpen, setUrlEvents]);

  // Open panels and sidebar defaults after first render (mount only)
  const didMountDefaultsRef = useRef(false);
  useEffect(() => {
    if (didMountDefaultsRef.current) return;
    didMountDefaultsRef.current = true;

    if (!isMobile) {
      setHumanitarianOpen(true);
      setSpendingOpen(true);
    }
    // Open sidebar by default on XL screens if no URL preference set
    if (urlEvents === null && typeof window !== "undefined" && window.innerWidth >= 1280) {
      setSidebarOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clean up URL if date param matches today (today is the default, shouldn't appear in URL)
  useEffect(() => {
    if (urlDate) {
      const today = new Date();
      const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      if (urlDate >= todayStr) {
        setUrlDate(null);
      }
    }
    // Run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [historicalData, setHistoricalData] = useState<CasualtyData | null>(null);
  const resetPendingRef = useRef(false);
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

  const handleTimelineDateChange = useCallback(
    (date: string) => {
      setTerritoryDate(date);
      const today = new Date();
      const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
      if (date >= todayStr) {
        setUrlDate(null);
      } else {
        setUrlDate(date);
      }
    },
    [setUrlDate],
  );

  // Fetch historical casualty data when timeline date changes (throttled — leading + trailing)
  const casualtyThrottleRef = useRef<NodeJS.Timeout | null>(null);
  const casualtyPendingDate = useRef<string | null>(null);
  const casualtyAbortRef = useRef<AbortController | null>(null);

  const fetchCasualties = useCallback(async (dateToFetch: string) => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    if (dateToFetch >= todayStr) {
      lastFetchedDate.current = null;
      return;
    }
    if (lastFetchedDate.current === dateToFetch) return;

    casualtyAbortRef.current?.abort();
    const controller = new AbortController();
    casualtyAbortRef.current = controller;

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
  }, []);

  useEffect(() => {
    if (!territoryDate) {
      lastFetchedDate.current = null;
      return;
    }

    if (!casualtyThrottleRef.current) {
      // Leading edge — fire immediately
      fetchCasualties(territoryDate);
      casualtyPendingDate.current = null;
      casualtyThrottleRef.current = setTimeout(() => {
        casualtyThrottleRef.current = null;
        // Trailing edge — fire with latest date if changes came in
        if (casualtyPendingDate.current) {
          fetchCasualties(casualtyPendingDate.current);
          casualtyPendingDate.current = null;
        }
      }, 500);
    } else {
      // Already throttled — store latest date for trailing edge
      casualtyPendingDate.current = territoryDate;
    }
  }, [territoryDate, fetchCasualties]);

  const handleToggleHumanitarian = useCallback(() => {
    setHumanitarianOpen((prev) => !prev);
  }, []);

  const handleToggleSpending = useCallback(() => {
    setSpendingOpen((prev) => !prev);
  }, []);

  const handleMapMoveEnd = useCallback(
    (center: [number, number], zoom: number) => {
      // Skip URL updates during reset flyTo animation
      if (resetPendingRef.current) {
        const [lng, lat] = center;
        const isDefault =
          Math.abs(lng - MAP_CENTER[0]) < 0.5 && Math.abs(lat - MAP_CENTER[1]) < 0.5;
        if (isDefault) {
          resetPendingRef.current = false;
          setUrlLng(null);
          setUrlLat(null);
          setUrlZoom(null);
        }
        return;
      }

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
    },
    [setUrlLng, setUrlLat, setUrlZoom],
  );

  const handleEventClick = useCallback(
    (date: string) => {
      handleTimelineDateChange(date);
      const event = events.find((e) => e.date === date);
      if (event?.lat != null && event?.lng != null) {
        setFlyToTarget({ lat: event.lat, lng: event.lng, zoom: 9 });
      }
    },
    [handleTimelineDateChange, events],
  );

  const handleToggleSidebar = useCallback(() => {
    setSidebarOpen((prev) => !prev);
  }, []);

  const handleReset = useCallback(() => {
    resetPendingRef.current = true;
    setTerritoryDate(null);
    setUrlDate(null);
    setUrlLng(null);
    setUrlLat(null);
    setUrlZoom(null);
    setUrlEvents(null);
    setFlyToTarget({ lat: MAP_CENTER[1], lng: MAP_CENTER[0], zoom: MAP_ZOOM });
    setSelectedMarker(null);
    setHumanitarianOpen(true);
    setSpendingOpen(true);
    setStatsCollapsed(false);
    setLayersCollapsed(false);
    setTimelineKey((prev) => prev + 1);
    setSidebarOpen(false);
    setLayers({
      territory: true,
      equipment: true,
      frontline: true,
      border: true,
      conflicts: true,
      heatmap: true,
      battles: true,
      operations: true,
      infrastructure: true,
      nato: true,
      thermal: true,
    });
  }, [setUrlDate, setUrlLng, setUrlLat, setUrlZoom, setUrlEvents]);

  const today = new Date();
  const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const isViewingPast = !!territoryDate && territoryDate < todayStr;
  const displayData = isViewingPast ? (historicalData ?? casualtyData) : casualtyData;

  const warDay = (() => {
    const start = new Date(2022, 1, 24);
    const current = territoryDate
      ? new Date(
          parseInt(territoryDate.slice(0, 4), 10),
          parseInt(territoryDate.slice(4, 6), 10) - 1,
          parseInt(territoryDate.slice(6, 8), 10),
        )
      : new Date();
    return Math.floor((current.getTime() - start.getTime()) / 86400000) + 1;
  })();

  // Find the active event for the current date (within 3 days)
  const activeMapEvent = (() => {
    if (!territoryDate) return null;
    const currentDateNum = parseInt(territoryDate, 10);
    for (const event of events) {
      const eventDateNum = parseInt(event.date, 10);
      if (Math.abs(currentDateNum - eventDateNum) <= 3 && event.lat != null && event.lng != null) {
        return {
          label: event.label,
          description: event.description,
          lat: event.lat,
          lng: event.lng,
        };
      }
    }
    return null;
  })();

  return (
    <SidebarProvider defaultOpen={false} open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <EventSidebar
        events={events}
        onEventClick={handleEventClick}
        currentDate={territoryDate}
        onClose={() => setSidebarOpen(false)}
      />
      <SidebarInset className="relative h-screen overflow-hidden">
        <MapView
          layers={layers}
          onMarkerClick={handleMarkerClick}
          onMoveEnd={handleMapMoveEnd}
          onDateChange={handleTimelineDateChange}
          territoryDate={territoryDate}
          battles={MAJOR_BATTLES}
          operations={MAJOR_OPERATIONS}
          nuclearPlants={NUCLEAR_PLANTS}
          dams={DAMS}
          bridges={BRIDGES}
          ports={PORTS}
          natoBases={NATO_BASES}
          belarusBases={BELARUS_BASES}
          gasPipelines={GAS_PIPELINES}
          gasStations={GAS_STATIONS}
          powerPlants={POWER_PLANTS}
          flyTo={flyToTarget}
          initialCenter={urlLng != null && urlLat != null ? [urlLng, urlLat] : undefined}
          initialZoom={urlZoom ?? undefined}
          activeEvent={activeMapEvent}
        />
        <Header eventsOpen={sidebarOpen} onToggleEvents={handleToggleSidebar} />
        <DayTracker
          warDay={warDay}
          territoryDate={territoryDate}
          dates={events}
          onDateChange={handleTimelineDateChange}
        />

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
        {selectedMarker && <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />}
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
          events={events}
          key={timelineKey}
          onDateChange={handleTimelineDateChange}
          initialDate={urlDate}
          externalDate={territoryDate}
          eventsOpen={sidebarOpen}
          onToggleEvents={handleToggleSidebar}
          onReset={handleReset}
          isHistorical={isViewingPast}
          dockSlot={
            statsCollapsed || !humanitarianOpen || !spendingOpen || layersCollapsed ? (
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
