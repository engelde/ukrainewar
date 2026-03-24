"use client";

import dynamic from "next/dynamic";
import { createParser, parseAsBoolean, parseAsFloat, parseAsString, useQueryState } from "nuqs";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DayTracker from "@/components/layout/day-tracker";
import EventSidebar from "@/components/layout/event-sidebar";
import Header, { Footer } from "@/components/layout/header";
import DetailPanel from "@/components/map/detail-panel";
import TimelineScrubber from "@/components/timeline/timeline-scrubber";

const HumanitarianPanel = dynamic(() => import("@/components/panels/humanitarian-panel"), {
  ssr: false,
});
const AirDefensePanel = dynamic(() => import("@/components/panels/air-defense-panel"), {
  ssr: false,
});
const EnergyPanel = dynamic(() => import("@/components/panels/energy-panel"), { ssr: false });
const InternationalSupportPanel = dynamic(
  () => import("@/components/panels/international-support-panel"),
  { ssr: false },
);
const UkraineLossesPanel = dynamic(() => import("@/components/panels/ukraine-losses-panel"), {
  ssr: false,
});
const SanctionsPanel = dynamic(() => import("@/components/panels/sanctions-panel"), { ssr: false });
const InfrastructurePanel = dynamic(() => import("@/components/panels/infrastructure-panel"), {
  ssr: false,
});
const SpendingPanel = dynamic(() => import("@/components/panels/spending-panel"), { ssr: false });

import StatsOverlay from "@/components/stats/stats-overlay";
import DraggablePanel from "@/components/ui/draggable-panel";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { BELARUS_BASES } from "@/data/belarus-bases";
import { GAS_PIPELINES, GAS_STATIONS, POWER_PLANTS } from "@/data/energy-assets";
import { BRIDGES, DAMS, PORTS } from "@/data/infrastructure";
import { NATO_BASES } from "@/data/nato-bases";
import { NUCLEAR_PLANTS } from "@/data/nuclear-plants";
import { MAJOR_OPERATIONS } from "@/data/operations";
import { RUSSIA_BASES } from "@/data/russia-bases";
import { UKRAINE_BASES } from "@/data/ukraine-bases";
import { useBattles } from "@/hooks/use-battles";
import { useEvents } from "@/hooks/use-events";
import { useIsMobile } from "@/hooks/use-mobile";
import { MAP_CENTER, MAP_ZOOM } from "@/lib/constants";
import type { CasualtyData, EquipmentMarker, MapLayers } from "@/lib/types";
import { usePanelPositionStore } from "@/stores/panel-position-store";

const MapView = dynamic(() => import("@/components/map/map-view"), {
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

// All layer keys and their defaults (all on)
const ALL_LAYER_KEYS: (keyof MapLayers)[] = [
  "territory",
  "equipment",
  "frontline",
  "border",
  "conflicts",
  "heatmap",
  "battles",
  "operations",
  "infrastructure",
  "nato",
  "thermal",
  "alliance",
  "buildup",
];

// All panel visibility keys and their defaults
const PANEL_KEYS = [
  "events",
  "russianLosses",
  "humanitarian",
  "spending",
  "energy",
  "airDefense",
  "support",
  "ukraineLosses",
  "sanctions",
  "infrastructurePanel",
] as const;
type PanelKey = (typeof PANEL_KEYS)[number];
const DEFAULT_VISIBLE_PANELS: PanelKey[] = [...PANEL_KEYS];
const DEFAULT_MINIMIZED_PANELS: PanelKey[] = [
  "events",
  "energy",
  "airDefense",
  "support",
  "ukraineLosses",
  "sanctions",
  "infrastructurePanel",
];

// Custom nuqs parser: comma-separated set of strings
const parseAsStringSet = createParser({
  parse: (value: string) => {
    if (!value) return new Set<string>();
    return new Set(value.split(",").filter(Boolean));
  },
  serialize: (value: Set<string>) => {
    if (value.size === 0) return "";
    return [...value].join(",");
  },
});

export default function AppShell({ casualtyData }: AppShellProps) {
  const isMobile = useIsMobile();
  const { events } = useEvents();
  const { battles } = useBattles();
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
  // Layers persisted as comma-separated "off" keys (only store disabled ones since default=all on)
  const [urlLayersOff, setUrlLayersOff] = useQueryState(
    "loff",
    parseAsStringSet.withOptions({ shallow: true }),
  );
  // Panel visibility as comma-separated visible panel keys
  const [urlPanels, setUrlPanels] = useQueryState(
    "panels",
    parseAsStringSet.withOptions({ shallow: true }),
  );
  // Stats panel collapsed
  const [urlStats, setUrlStats] = useQueryState(
    "stats",
    parseAsBoolean.withOptions({ shallow: true }),
  );
  // Minimized panels as comma-separated keys (default: none minimized)
  const [urlMinimized, setUrlMinimized] = useQueryState(
    "pmin",
    parseAsStringSet.withOptions({ shallow: true }),
  );

  // Layers that are OFF by default (user must opt in)
  const DEFAULT_LAYERS_OFF = new Set<string>(["alliance", "thermal"]);

  // Derive layer state from URL (default: all on except DEFAULT_LAYERS_OFF; URL stores which are off)
  const layers = useMemo<MapLayers>(() => {
    const off = urlLayersOff ?? DEFAULT_LAYERS_OFF;
    const result = {} as MapLayers;
    for (const key of ALL_LAYER_KEYS) {
      result[key] = !off.has(key);
    }
    return result;
  }, [urlLayersOff]);

  const setLayers = useCallback(
    (updater: (prev: MapLayers) => MapLayers) => {
      const off = urlLayersOff ?? DEFAULT_LAYERS_OFF;
      const prev = {} as MapLayers;
      for (const key of ALL_LAYER_KEYS) prev[key] = !off.has(key);
      const next = updater(prev);
      const newOff = new Set<string>();
      for (const key of ALL_LAYER_KEYS) {
        if (!next[key]) newOff.add(key);
      }
      const isDefault =
        newOff.size === DEFAULT_LAYERS_OFF.size &&
        [...DEFAULT_LAYERS_OFF].every((k) => newOff.has(k));
      setUrlLayersOff(isDefault ? null : newOff);
    },
    [urlLayersOff, setUrlLayersOff],
  );

  // Derive panel visibility from URL
  const panelVisibility = useMemo(() => {
    const visible = urlPanels ?? new Set<string>(DEFAULT_VISIBLE_PANELS);
    const result = {} as Record<PanelKey, boolean>;
    for (const key of PANEL_KEYS) {
      result[key] = visible.has(key);
    }
    return result;
  }, [urlPanels]);

  // Derive panel minimized state from URL (default: most panels minimized)
  const panelMinimized = useMemo(() => {
    const min = urlMinimized ?? new Set<string>(DEFAULT_MINIMIZED_PANELS);
    const result = {} as Record<PanelKey, boolean>;
    for (const key of PANEL_KEYS) {
      result[key] = min.has(key);
    }
    return result;
  }, [urlMinimized]);

  // Panel open = visible AND not minimized
  const panelOpen = useMemo(() => {
    const result = {} as Record<PanelKey, boolean>;
    for (const key of PANEL_KEYS) {
      result[key] = panelVisibility[key] && !panelMinimized[key];
    }
    return result;
  }, [panelVisibility, panelMinimized]);

  const clearPanelPositions = usePanelPositionStore((s) => s.clearPositions);

  const [selectedMarker, setSelectedMarker] = useState<EquipmentMarker | null>(null);
  const [territoryDate, setTerritoryDate] = useState<string | null>(urlDate);

  // Sync territoryDate when urlDate changes externally (URL navigation, calendar, etc.)
  useEffect(() => {
    setTerritoryDate(urlDate);
  }, [urlDate]);
  const [statsCollapsed, setStatsCollapsed] = useState(urlStats === true);
  const [flyToTarget, setFlyToTarget] = useState<{
    lat: number;
    lng: number;
    zoom?: number;
  } | null>(null);
  const [timelineKey, setTimelineKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(urlEvents !== false);

  // Sync sidebar state to URL
  useEffect(() => {
    setUrlEvents(sidebarOpen ? true : null);
  }, [sidebarOpen, setUrlEvents]);

  // Open sidebar defaults after first render (mount only)
  const didMountDefaultsRef = useRef(false);
  useEffect(() => {
    if (didMountDefaultsRef.current) return;
    didMountDefaultsRef.current = true;

    // Open sidebar by default if no URL preference set
    if (urlEvents === null) {
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

  const handleToggleLayer = useCallback(
    (layer: keyof MapLayers) => {
      setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
    },
    [setLayers],
  );

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

  // Minimize handler — adds panel key to minimized set
  const handleMinimizePanel = useCallback(
    (key: string) => {
      const current = urlMinimized ?? new Set<string>(DEFAULT_MINIMIZED_PANELS);
      const next = new Set(current);
      next.add(key);
      const isDefault =
        next.size === DEFAULT_MINIMIZED_PANELS.length &&
        DEFAULT_MINIMIZED_PANELS.every((k) => next.has(k));
      setUrlMinimized(isDefault ? null : next);
    },
    [urlMinimized, setUrlMinimized],
  );
  const handleMinimizeHumanitarian = useCallback(
    () => handleMinimizePanel("humanitarian"),
    [handleMinimizePanel],
  );
  const handleMinimizeSpending = useCallback(
    () => handleMinimizePanel("spending"),
    [handleMinimizePanel],
  );
  const handleMinimizeEnergy = useCallback(
    () => handleMinimizePanel("energy"),
    [handleMinimizePanel],
  );
  const handleMinimizeAirDefense = useCallback(
    () => handleMinimizePanel("airDefense"),
    [handleMinimizePanel],
  );
  const handleMinimizeSupport = useCallback(
    () => handleMinimizePanel("support"),
    [handleMinimizePanel],
  );
  const handleMinimizeUkraineLosses = useCallback(
    () => handleMinimizePanel("ukraineLosses"),
    [handleMinimizePanel],
  );
  const handleMinimizeSanctions = useCallback(
    () => handleMinimizePanel("sanctions"),
    [handleMinimizePanel],
  );
  const handleMinimizeInfrastructure = useCallback(
    () => handleMinimizePanel("infrastructurePanel"),
    [handleMinimizePanel],
  );
  const handleMinimizeStats = useCallback(() => {
    setStatsCollapsed(true);
    setUrlStats(true);
  }, [setUrlStats]);

  // Expand handler — removes panel key from minimized set
  const handleExpandPanel = useCallback(
    (key: string) => {
      const current = urlMinimized ?? new Set<string>(DEFAULT_MINIMIZED_PANELS);
      const next = new Set(current);
      next.delete(key);
      const isDefault =
        next.size === DEFAULT_MINIMIZED_PANELS.length &&
        DEFAULT_MINIMIZED_PANELS.every((k) => next.has(k));
      setUrlMinimized(isDefault ? null : next);
    },
    [urlMinimized, setUrlMinimized],
  );
  const handleExpandHumanitarian = useCallback(
    () => handleExpandPanel("humanitarian"),
    [handleExpandPanel],
  );
  const handleExpandSpending = useCallback(
    () => handleExpandPanel("spending"),
    [handleExpandPanel],
  );
  const handleExpandEnergy = useCallback(() => handleExpandPanel("energy"), [handleExpandPanel]);
  const handleExpandAirDefense = useCallback(
    () => handleExpandPanel("airDefense"),
    [handleExpandPanel],
  );
  const handleExpandSupport = useCallback(() => handleExpandPanel("support"), [handleExpandPanel]);
  const handleExpandUkraineLosses = useCallback(
    () => handleExpandPanel("ukraineLosses"),
    [handleExpandPanel],
  );
  const handleExpandSanctions = useCallback(
    () => handleExpandPanel("sanctions"),
    [handleExpandPanel],
  );
  const handleExpandInfrastructure = useCallback(
    () => handleExpandPanel("infrastructurePanel"),
    [handleExpandPanel],
  );
  const handleExpandStats = useCallback(() => {
    setStatsCollapsed(false);
    setUrlStats(null);
  }, [setUrlStats]);

  // Visibility toggles — called by Options popup (hide/show entirely)
  const handleVisibilityToggle = useCallback(
    (key: string) => {
      const current = urlPanels ?? new Set<string>(DEFAULT_VISIBLE_PANELS);
      const next = new Set(current);
      const wasVisible = next.has(key);
      if (wasVisible) {
        next.delete(key);
        // When hiding events via Options, also close the sidebar
        if (key === "events") {
          setSidebarOpen(false);
        }
      } else {
        next.add(key);
        // When making visible, also ensure it's not minimized
        if (key === "events") {
          setSidebarOpen(true);
        } else if (key === "russianLosses") {
          setStatsCollapsed(false);
          setUrlStats(null);
        } else {
          handleExpandPanel(key);
        }
      }
      // Store null if matches defaults to keep URL clean
      const isDefault =
        next.size === DEFAULT_VISIBLE_PANELS.length &&
        DEFAULT_VISIBLE_PANELS.every((k) => next.has(k));
      setUrlPanels(isDefault ? null : next);
    },
    [urlPanels, setUrlPanels, setUrlStats, handleExpandPanel],
  );

  // Global Escape key handler — minimizes the topmost open panel
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      if (selectedMarker) {
        setSelectedMarker(null);
      } else if (panelOpen.infrastructurePanel) {
        handleMinimizePanel("infrastructurePanel");
      } else if (panelOpen.sanctions) {
        handleMinimizePanel("sanctions");
      } else if (panelOpen.ukraineLosses) {
        handleMinimizePanel("ukraineLosses");
      } else if (panelOpen.support) {
        handleMinimizePanel("support");
      } else if (panelOpen.airDefense) {
        handleMinimizePanel("airDefense");
      } else if (panelOpen.energy) {
        handleMinimizePanel("energy");
      } else if (panelOpen.spending) {
        handleMinimizePanel("spending");
      } else if (panelOpen.humanitarian) {
        handleMinimizePanel("humanitarian");
      } else if (sidebarOpen) {
        setSidebarOpen(false);
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [selectedMarker, panelOpen, handleMinimizePanel, sidebarOpen]);

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
    setSidebarOpen((prev) => {
      const next = !prev;
      // Ensure events panel visibility stays in sync
      const current = urlPanels ?? new Set<string>(DEFAULT_VISIBLE_PANELS);
      if (next && !current.has("events")) {
        const updated = new Set(current);
        updated.add("events");
        const isDefault =
          updated.size === DEFAULT_VISIBLE_PANELS.length &&
          DEFAULT_VISIBLE_PANELS.every((k) => updated.has(k));
        setUrlPanels(isDefault ? null : updated);
      }
      return next;
    });
  }, [urlPanels, setUrlPanels]);

  const handleReset = useCallback(() => {
    resetPendingRef.current = true;
    setTerritoryDate(null);
    setUrlDate(null);
    setUrlLng(null);
    setUrlLat(null);
    setUrlZoom(null);
    setUrlEvents(null);
    setUrlLayersOff(null);
    setUrlPanels(null);
    setUrlStats(null);
    setUrlMinimized(null);
    setFlyToTarget({ lat: MAP_CENTER[1], lng: MAP_CENTER[0], zoom: MAP_ZOOM });
    setSelectedMarker(null);
    setStatsCollapsed(false);
    setTimelineKey((prev) => prev + 1);
    setSidebarOpen(true);
    clearPanelPositions();
  }, [
    setUrlDate,
    setUrlLng,
    setUrlLat,
    setUrlZoom,
    setUrlEvents,
    setUrlLayersOff,
    setUrlPanels,
    setUrlStats,
    setUrlMinimized,
    clearPanelPositions,
  ]);

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

  // Dynamic panel positioning — compute non-overlapping positions for left-side panels
  const PANEL_W = 320; // max-w-xs = 20rem = 320px
  const PANEL_GAP = 12;
  const TOP_OFFSET = 64; // below header
  const SIDE_PAD = 24;
  const panelPositions = useMemo(() => {
    const positions: Record<string, { x: number; y: number }> = {};
    // Russian Losses uses CSS right-positioning — not computed here

    // Left-side panels: stack from top-left, wrapping to next column
    const leftPanelOrder: PanelKey[] = [
      "humanitarian",
      "spending",
      "energy",
      "airDefense",
      "support",
      "ukraineLosses",
      "sanctions",
      "infrastructurePanel",
    ];
    let col = 0;
    let row = 0;
    const maxRowsPerCol = 2;

    for (const key of leftPanelOrder) {
      if (!panelOpen[key]) continue;
      const x = SIDE_PAD + col * (PANEL_W + PANEL_GAP);
      const y = TOP_OFFSET + row * 280;
      positions[key] = { x, y };
      row++;
      if (row >= maxRowsPerCol) {
        row = 0;
        col++;
      }
    }
    return positions;
  }, [panelOpen]);

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
          battles={battles}
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
          onReset={handleReset}
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
            infrastructurePanel: () => handleVisibilityToggle("infrastructurePanel"),
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
            infrastructurePanel: panelVisibility.infrastructurePanel,
          }}
        />

        {/* Expanded panels — only when visible AND not minimized */}
        {panelOpen.russianLosses && displayData && !statsCollapsed && (
          <DraggablePanel
            panelKey="russianLosses"
            className="fixed right-4 top-14 z-30 sm:right-6 sm:top-16 max-w-xs"
          >
            <StatsOverlay
              data={displayData}
              isHistorical={isViewingPast && !!historicalData}
              collapsed={false}
              onCollapse={handleMinimizeStats}
            />
          </DraggablePanel>
        )}
        {selectedMarker && <DetailPanel marker={selectedMarker} onClose={handleCloseDetail} />}
        {panelOpen.humanitarian && (
          <DraggablePanel panelKey="humanitarian" defaultPosition={panelPositions.humanitarian}>
            <HumanitarianPanel
              isOpen={true}
              onToggle={handleMinimizeHumanitarian}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.spending && (
          <DraggablePanel panelKey="spending" defaultPosition={panelPositions.spending}>
            <SpendingPanel
              isOpen={true}
              onToggle={handleMinimizeSpending}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.energy && (
          <DraggablePanel panelKey="energy" defaultPosition={panelPositions.energy}>
            <EnergyPanel
              isOpen={true}
              onToggle={handleMinimizeEnergy}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.airDefense && (
          <DraggablePanel panelKey="airDefense" defaultPosition={panelPositions.airDefense}>
            <AirDefensePanel
              isOpen={true}
              onToggle={handleMinimizeAirDefense}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.support && (
          <DraggablePanel panelKey="support" defaultPosition={panelPositions.support}>
            <InternationalSupportPanel isOpen={true} onToggle={handleMinimizeSupport} />
          </DraggablePanel>
        )}
        {panelOpen.ukraineLosses && (
          <DraggablePanel panelKey="ukraineLosses" defaultPosition={panelPositions.ukraineLosses}>
            <UkraineLossesPanel
              isOpen={true}
              onToggle={handleMinimizeUkraineLosses}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.sanctions && (
          <DraggablePanel panelKey="sanctions" defaultPosition={panelPositions.sanctions}>
            <SanctionsPanel
              isOpen={true}
              onToggle={handleMinimizeSanctions}
              timelineDate={territoryDate ?? undefined}
            />
          </DraggablePanel>
        )}
        {panelOpen.infrastructurePanel && (
          <DraggablePanel
            panelKey="infrastructurePanel"
            defaultPosition={panelPositions.infrastructurePanel}
          >
            <InfrastructurePanel
              isOpen={true}
              onToggle={handleMinimizeInfrastructure}
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
              {panelVisibility.humanitarian && panelMinimized.humanitarian && (
                <HumanitarianPanel
                  isOpen={false}
                  onToggle={handleExpandHumanitarian}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.spending && panelMinimized.spending && (
                <SpendingPanel
                  isOpen={false}
                  onToggle={handleExpandSpending}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.energy && panelMinimized.energy && (
                <EnergyPanel
                  isOpen={false}
                  onToggle={handleExpandEnergy}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.airDefense && panelMinimized.airDefense && (
                <AirDefensePanel
                  isOpen={false}
                  onToggle={handleExpandAirDefense}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.support && panelMinimized.support && (
                <InternationalSupportPanel isOpen={false} onToggle={handleExpandSupport} />
              )}
              {panelVisibility.ukraineLosses && panelMinimized.ukraineLosses && (
                <UkraineLossesPanel
                  isOpen={false}
                  onToggle={handleExpandUkraineLosses}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.sanctions && panelMinimized.sanctions && (
                <SanctionsPanel
                  isOpen={false}
                  onToggle={handleExpandSanctions}
                  timelineDate={territoryDate ?? undefined}
                />
              )}
              {panelVisibility.infrastructurePanel && panelMinimized.infrastructurePanel && (
                <InfrastructurePanel
                  isOpen={false}
                  onToggle={handleExpandInfrastructure}
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
