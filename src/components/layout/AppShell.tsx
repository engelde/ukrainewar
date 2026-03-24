"use client";

import dynamic from "next/dynamic";
import { parseAsBoolean, parseAsFloat, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useRef, useState } from "react";
import DayTracker from "@/components/layout/DayTracker";
import EventSidebar from "@/components/layout/EventSidebar";
import Header, { Footer } from "@/components/layout/Header";
import DetailPanel from "@/components/map/DetailPanel";
import TimelineScrubber from "@/components/map/TimelineScrubber";

const HumanitarianPanel = dynamic(() => import("@/components/humanitarian/HumanitarianPanel"), {
  ssr: false,
});
const AirDefensePanel = dynamic(() => import("@/components/panels/AirDefensePanel"), {
  ssr: false,
});
const EnergyPanel = dynamic(() => import("@/components/panels/EnergyPanel"), { ssr: false });
const InternationalSupportPanel = dynamic(
  () => import("@/components/panels/InternationalSupportPanel"),
  { ssr: false },
);
const UkraineLossesPanel = dynamic(() => import("@/components/panels/UkraineLossesPanel"), {
  ssr: false,
});
const SanctionsPanel = dynamic(() => import("@/components/panels/SanctionsPanel"), { ssr: false });
const SpendingPanel = dynamic(() => import("@/components/spending/SpendingPanel"), { ssr: false });

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
import { RUSSIA_BASES } from "@/data/russia-bases";
import { UKRAINE_BASES } from "@/data/ukraine-bases";
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
  const [energyOpen, setEnergyOpen] = useState(false);
  const [airDefenseOpen, setAirDefenseOpen] = useState(false);
  const [supportOpen, setSupportOpen] = useState(false);
  const [ukraineLossesOpen, setUkraineLossesOpen] = useState(false);
  const [sanctionsOpen, setSanctionsOpen] = useState(false);
  const [statsCollapsed, setStatsCollapsed] = useState(false);

  // Panel visibility: controlled by Options popup (hide/show entirely)
  const [panelVisibility, setPanelVisibility] = useState({
    events: true,
    russianLosses: true,
    humanitarian: false,
    spending: false,
    energy: false,
    airDefense: false,
    support: false,
    ukraineLosses: false,
    sanctions: false,
  });
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

  // Minimize handlers — called by panel X/close buttons (collapse to dock)
  const handleMinimizeHumanitarian = useCallback(() => setHumanitarianOpen(false), []);
  const handleMinimizeSpending = useCallback(() => setSpendingOpen(false), []);
  const handleMinimizeEnergy = useCallback(() => setEnergyOpen(false), []);
  const handleMinimizeAirDefense = useCallback(() => setAirDefenseOpen(false), []);
  const handleMinimizeSupport = useCallback(() => setSupportOpen(false), []);
  const handleMinimizeUkraineLosses = useCallback(() => setUkraineLossesOpen(false), []);
  const handleMinimizeSanctions = useCallback(() => setSanctionsOpen(false), []);
  const handleMinimizeStats = useCallback(() => setStatsCollapsed(true), []);

  // Expand handlers — called by dock collapsed bars
  const handleExpandHumanitarian = useCallback(() => setHumanitarianOpen(true), []);
  const handleExpandSpending = useCallback(() => setSpendingOpen(true), []);
  const handleExpandEnergy = useCallback(() => setEnergyOpen(true), []);
  const handleExpandAirDefense = useCallback(() => setAirDefenseOpen(true), []);
  const handleExpandSupport = useCallback(() => setSupportOpen(true), []);
  const handleExpandUkraineLosses = useCallback(() => setUkraineLossesOpen(true), []);
  const handleExpandSanctions = useCallback(() => setSanctionsOpen(true), []);
  const handleExpandStats = useCallback(() => setStatsCollapsed(false), []);

  // Visibility toggles — called by Options popup (hide/show entirely)
  const handleVisibilityToggle = useCallback((key: string) => {
    setPanelVisibility((prev) => {
      const next = { ...prev, [key]: !prev[key as keyof typeof prev] };
      // When making visible, also expand the panel
      if (next[key as keyof typeof next]) {
        switch (key) {
          case "events":
            setSidebarOpen(true);
            break;
          case "russianLosses":
            setStatsCollapsed(false);
            break;
          case "humanitarian":
            setHumanitarianOpen(true);
            break;
          case "spending":
            setSpendingOpen(true);
            break;
          case "energy":
            setEnergyOpen(true);
            break;
          case "airDefense":
            setAirDefenseOpen(true);
            break;
          case "support":
            setSupportOpen(true);
            break;
          case "ukraineLosses":
            setUkraineLossesOpen(true);
            break;
          case "sanctions":
            setSanctionsOpen(true);
            break;
        }
      }
      return next;
    });
  }, []);

  // Global Escape key handler — closes the topmost open panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      // Close in reverse priority order: detail panel → draggable panels → sidebar
      if (selectedMarker) {
        setSelectedMarker(null);
      } else if (sanctionsOpen) {
        setSanctionsOpen(false);
      } else if (ukraineLossesOpen) {
        setUkraineLossesOpen(false);
      } else if (supportOpen) {
        setSupportOpen(false);
      } else if (airDefenseOpen) {
        setAirDefenseOpen(false);
      } else if (energyOpen) {
        setEnergyOpen(false);
      } else if (spendingOpen) {
        setSpendingOpen(false);
      } else if (humanitarianOpen) {
        setHumanitarianOpen(false);
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [
    selectedMarker,
    sanctionsOpen,
    ukraineLossesOpen,
    supportOpen,
    airDefenseOpen,
    energyOpen,
    spendingOpen,
    humanitarianOpen,
    sidebarOpen,
  ]);

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
    setEnergyOpen(false);
    setAirDefenseOpen(false);
    setSupportOpen(false);
    setUkraineLossesOpen(false);
    setSanctionsOpen(false);
    setStatsCollapsed(false);
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
    <SidebarProvider
      defaultOpen={false}
      open={panelVisibility.events && sidebarOpen}
      onOpenChange={setSidebarOpen}
    >
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
          ukraineBases={UKRAINE_BASES}
          russiaBases={RUSSIA_BASES}
          gasPipelines={GAS_PIPELINES}
          gasStations={GAS_STATIONS}
          powerPlants={POWER_PLANTS}
          flyTo={flyToTarget}
          initialCenter={urlLng != null && urlLat != null ? [urlLng, urlLat] : undefined}
          initialZoom={urlZoom ?? undefined}
          activeEvent={activeMapEvent}
        />
        <Header />
        <DayTracker
          warDay={warDay}
          territoryDate={territoryDate}
          dates={events}
          onDateChange={handleTimelineDateChange}
          layers={layers}
          onToggleLayer={handleToggleLayer}
          panelToggles={{
            events: () => handleVisibilityToggle("events"),
            russianLosses: () => handleVisibilityToggle("russianLosses"),
            humanitarian: () => handleVisibilityToggle("humanitarian"),
            spending: () => handleVisibilityToggle("spending"),
            energy: () => handleVisibilityToggle("energy"),
            airDefense: () => handleVisibilityToggle("airDefense"),
            support: () => handleVisibilityToggle("support"),
            ukraineLosses: () => handleVisibilityToggle("ukraineLosses"),
            sanctions: () => handleVisibilityToggle("sanctions"),
          }}
          panelStates={{
            events: panelVisibility.events,
            russianLosses: panelVisibility.russianLosses,
            humanitarian: panelVisibility.humanitarian,
            spending: panelVisibility.spending,
            energy: panelVisibility.energy,
            airDefense: panelVisibility.airDefense,
            support: panelVisibility.support,
            ukraineLosses: panelVisibility.ukraineLosses,
            sanctions: panelVisibility.sanctions,
          }}
        />

        {/* Expanded panels — only when visible AND open */}
        {panelVisibility.russianLosses && displayData && !statsCollapsed && (
          <DraggablePanel className="fixed right-4 top-14 z-30 sm:right-6 sm:top-16 max-w-xs">
            <StatsOverlay
              data={displayData}
              isHistorical={isViewingPast && !!historicalData}
              collapsed={false}
              onCollapse={handleMinimizeStats}
            />
          </DraggablePanel>
        )}
        {selectedMarker && <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />}
        {panelVisibility.humanitarian && humanitarianOpen && (
          <DraggablePanel className="fixed left-4 top-14 z-30 sm:left-6 sm:top-16 max-w-xs">
            <HumanitarianPanel
              isOpen={true}
              onToggle={handleMinimizeHumanitarian}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelVisibility.spending && spendingOpen && (
          <DraggablePanel className="fixed left-4 top-[280px] z-30 sm:left-[303px] sm:top-16 max-w-xs">
            <SpendingPanel
              isOpen={true}
              onToggle={handleMinimizeSpending}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelVisibility.energy && energyOpen && (
          <DraggablePanel className="fixed left-4 top-[280px] z-30 sm:left-[600px] sm:top-16 max-w-xs">
            <EnergyPanel
              isOpen={true}
              onToggle={handleMinimizeEnergy}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelVisibility.airDefense && airDefenseOpen && (
          <DraggablePanel className="fixed left-4 top-[360px] z-30 sm:left-[600px] sm:top-[300px] max-w-xs">
            <AirDefensePanel
              isOpen={true}
              onToggle={handleMinimizeAirDefense}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelVisibility.support && supportOpen && (
          <DraggablePanel className="fixed left-4 top-[200px] z-30 sm:left-[calc(50vw-230px)] sm:top-16">
            <InternationalSupportPanel isOpen={true} onToggle={handleMinimizeSupport} />
          </DraggablePanel>
        )}
        {panelVisibility.ukraineLosses && ukraineLossesOpen && (
          <DraggablePanel className="fixed left-4 top-[200px] z-30 sm:left-[calc(50vw-180px)] sm:top-16">
            <UkraineLossesPanel
              isOpen={true}
              onToggle={handleMinimizeUkraineLosses}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelVisibility.sanctions && sanctionsOpen && (
          <DraggablePanel className="fixed left-4 top-[200px] z-30 sm:left-[calc(50vw+120px)] sm:top-16">
            <SanctionsPanel
              isOpen={true}
              onToggle={handleMinimizeSanctions}
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
          eventsOpen={panelVisibility.events && sidebarOpen}
          onToggleEvents={handleToggleSidebar}
          onReset={handleReset}
          isHistorical={isViewingPast}
          dockSlot={
            <>
              {panelVisibility.russianLosses && statsCollapsed && displayData && (
                <StatsOverlay
                  data={displayData}
                  isHistorical={isViewingPast && !!historicalData}
                  collapsed={true}
                  onExpand={handleExpandStats}
                />
              )}
              {panelVisibility.humanitarian && !humanitarianOpen && (
                <HumanitarianPanel
                  isOpen={false}
                  onToggle={handleExpandHumanitarian}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.spending && !spendingOpen && (
                <SpendingPanel
                  isOpen={false}
                  onToggle={handleExpandSpending}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.energy && !energyOpen && (
                <EnergyPanel
                  isOpen={false}
                  onToggle={handleExpandEnergy}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.airDefense && !airDefenseOpen && (
                <AirDefensePanel
                  isOpen={false}
                  onToggle={handleExpandAirDefense}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.support && !supportOpen && (
                <InternationalSupportPanel isOpen={false} onToggle={handleExpandSupport} />
              )}
              {panelVisibility.ukraineLosses && !ukraineLossesOpen && (
                <UkraineLossesPanel
                  isOpen={false}
                  onToggle={handleExpandUkraineLosses}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.sanctions && !sanctionsOpen && (
                <SanctionsPanel
                  isOpen={false}
                  onToggle={handleExpandSanctions}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
            </>
          }
        />

        <Footer />
      </SidebarInset>
    </SidebarProvider>
  );
}
