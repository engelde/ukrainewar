"use client";

import maplibregl from "maplibre-gl";
import { useCallback, useEffect, useRef, useState } from "react";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Battle } from "@/data/battles";
import type { BelarusBase } from "@/data/belarus-bases";
import type { GasPipeline, GasStation, PowerPlant } from "@/data/energy-assets";
import type { Bridge, Dam, Port } from "@/data/infrastructure";
import { getStatusAtDate } from "@/data/infrastructure";
import { getAttackLocations, MISSILE_ATTACKS } from "@/data/missile-attacks";
import { MOBILIZATION_GROUPINGS } from "@/data/mobilization";
import type { NATOBase } from "@/data/nato-bases";
import type { NuclearPlant } from "@/data/nuclear-plants";
import type { MilitaryOperation } from "@/data/operations";
import type { RussiaBase } from "@/data/russia-bases";
import type { UkraineBase } from "@/data/ukraine-bases";
import { t } from "@/i18n";
import { MAP_CENTER, MAP_STYLE, MAP_ZOOM } from "@/lib/constants";
import type { EquipmentMarker, MapLayers } from "@/lib/types";
import { formatDateDisplay, formatISODate } from "@/lib/utils";
import {
  battleGeoJSON,
  findFirstSymbolLayer,
  monthIndex,
  operationArrowheadsGeoJSON,
  operationsGeoJSON,
} from "./map-geojson";
import {
  loadConflictIcons,
  loadEquipmentIcons,
  loadInfrastructureIcons,
  normalizeEquipmentCategory,
  STATUS_COLORS,
} from "./map-icons";

interface AcledOblastMonthly {
  month: string;
  year: number;
  events: number;
  fatalities: number;
}

interface AcledOblast {
  name: string;
  pcode: string;
  totalEvents: number;
  totalFatalities: number;
  monthly: AcledOblastMonthly[];
}

interface AcledRegionalData {
  oblasts: AcledOblast[];
  timeline: { month: string; year: number; events: number; fatalities: number }[];
  yearlyTotals: { year: number; events: number; fatalities: number }[];
}

const ACLED_EVENT_COLORS: Record<string, string> = {
  Battles: "#ef4444",
  "Explosions/Remote violence": "#f97316",
  "Violence against civilians": "#a855f7",
  "Strategic developments": "#3b82f6",
  Protests: "#22c55e",
  Riots: "#eab308",
};

// VIINA covers Feb 2022 – July 2024; DeepState covers July 2024+
const DEEPSTATE_START = "20240708";

interface MapViewProps {
  layers: MapLayers;
  onMarkerClick?: (marker: EquipmentMarker) => void;
  onMoveEnd?: (center: [number, number], zoom: number) => void;
  onDateChange?: (date: string) => void;
  territoryDate?: string | null;
  battles?: Battle[];
  operations?: MilitaryOperation[];
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  activeEvent?: { label: string; description: string; lat: number; lng: number } | null;
  nuclearPlants?: NuclearPlant[];
  dams?: Dam[];
  bridges?: Bridge[];
  ports?: Port[];
  natoBases?: NATOBase[];
  belarusBases?: BelarusBase[];
  gasPipelines?: GasPipeline[];
  gasStations?: GasStation[];
  powerPlants?: PowerPlant[];
  ukraineBases?: UkraineBase[];
  russiaBases?: RussiaBase[];
}

export default function MapView({
  layers,
  onMarkerClick,
  onMoveEnd,
  onDateChange,
  territoryDate,
  battles = [],
  operations = [],
  flyTo: flyToTarget,
  initialCenter,
  initialZoom,
  activeEvent,
  nuclearPlants = [],
  dams = [],
  bridges = [],
  ports = [],
  natoBases = [],
  belarusBases = [],
  gasPipelines = [],
  gasStations = [],
  powerPlants = [],
  ukraineBases = [],
  russiaBases = [],
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const layersRef = useRef(layers);
  useEffect(() => {
    layersRef.current = layers;
  }, [layers]);
  const equipmentDataRef = useRef<EquipmentMarker[]>([]);
  const [_equipmentVersion, setEquipmentVersion] = useState(0);
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const acledDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const acledPopupRef = useRef<maplibregl.Popup | null>(null);
  const battlePopupRef = useRef<maplibregl.Popup | null>(null);
  const operationPopupRef = useRef<maplibregl.Popup | null>(null);
  const infrastructurePopupRef = useRef<maplibregl.Popup | null>(null);
  const natoPopupRef = useRef<maplibregl.Popup | null>(null);
  const militaryBasePopupRef = useRef<maplibregl.Popup | null>(null);
  const heatmapPopupRef = useRef<maplibregl.Popup | null>(null);
  const attackPopupRef = useRef<maplibregl.Popup | null>(null);
  const buildupPopupRef = useRef<maplibregl.Popup | null>(null);
  const eventMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onMoveEndRef = useRef(onMoveEnd);
  useEffect(() => {
    onMoveEndRef.current = onMoveEnd;
  }, [onMoveEnd]);
  const onDateChangeRef = useRef(onDateChange);
  useEffect(() => {
    onDateChangeRef.current = onDateChange;
  }, [onDateChange]);
  const acledRegionalRef = useRef<AcledRegionalData | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const oblastsRef = useRef<GeoJSON.FeatureCollection | null>(null);

  const loadUkraineBorder = useCallback(async (mapInstance: maplibregl.Map) => {
    if (mapInstance.getSource("ukraine-border")) return;

    const [maskData, borderData, russiaData, oblastsData] = await Promise.all([
      fetch("/data/geo/ukraine-mask.json").then((r) => r.json()),
      fetch("/data/geo/ukraine-border.json").then((r) => r.json()),
      fetch("/data/geo/russia-border.json").then((r) => r.json()),
      fetch("/data/geo/ukraine-oblasts.json").then((r) => r.json()),
    ]);
    oblastsRef.current = oblastsData as GeoJSON.FeatureCollection;

    if (!mapInstance.isStyleLoaded() || mapInstance.getSource("ukraine-border")) return;

    const beforeLayer = findFirstSymbolLayer(mapInstance);

    // Dim mask — darkens everything outside Ukraine
    mapInstance.addSource("ukraine-mask", {
      type: "geojson",
      data: maskData as GeoJSON.FeatureCollection,
    });

    mapInstance.addLayer({
      id: "ukraine-mask-fill",
      type: "fill",
      source: "ukraine-mask",
      paint: {
        "fill-color": "#000008",
        "fill-opacity": 0.7,
      },
    });

    // ── Russia border (rendered FIRST so Ukraine renders on top) ──────

    mapInstance.addSource("russia-border", {
      type: "geojson",
      data: russiaData as GeoJSON.FeatureCollection,
    });

    mapInstance.addLayer(
      {
        id: "russia-border-glow",
        type: "line",
        source: "russia-border",
        paint: {
          "line-color": "#d44a4a",
          "line-width": 10,
          "line-opacity": 0.2,
          "line-blur": 6,
        },
      },
      beforeLayer,
    );

    mapInstance.addLayer(
      {
        id: "russia-border-line",
        type: "line",
        source: "russia-border",
        paint: {
          "line-color": "#e87b7b",
          "line-width": 2,
          "line-opacity": 0.8,
        },
      },
      beforeLayer,
    );

    // ── Ukraine border (rendered AFTER Russia — on top at shared boundary) ──

    mapInstance.addSource("ukraine-border", {
      type: "geojson",
      data: borderData as GeoJSON.FeatureCollection,
    });

    // Subtle inner fill — makes Ukraine slightly brighter than surroundings
    mapInstance.addLayer(
      {
        id: "ukraine-inner-glow",
        type: "fill",
        source: "ukraine-border",
        paint: {
          "fill-color": "#1a2a3a",
          "fill-opacity": 0.15,
        },
      },
      beforeLayer,
    );

    // Wide outer glow
    mapInstance.addLayer(
      {
        id: "ukraine-border-glow",
        type: "line",
        source: "ukraine-border",
        paint: {
          "line-color": "#4a9ad4",
          "line-width": 12,
          "line-opacity": 0.25,
          "line-blur": 8,
        },
      },
      beforeLayer,
    );

    // Main border line
    mapInstance.addLayer(
      {
        id: "ukraine-border-line",
        type: "line",
        source: "ukraine-border",
        paint: {
          "line-color": "#7bbde8",
          "line-width": 2.5,
          "line-opacity": 0.9,
        },
      },
      beforeLayer,
    );

    // Apply current border visibility (the toggle useEffect may have fired before layers existed)
    const borderVis = layersRef.current.border ? "visible" : "none";
    for (const id of [
      "ukraine-mask-fill",
      "ukraine-inner-glow",
      "ukraine-border-glow",
      "ukraine-border-line",
      "russia-border-glow",
      "russia-border-line",
    ]) {
      if (mapInstance.getLayer(id)) {
        mapInstance.setLayoutProperty(id, "visibility", borderVis);
      }
    }
  }, []);

  // Alliance country outlines — loaded once from API
  const allianceLoadedRef = useRef(false);
  const ensureAllianceLayers = useCallback((mapInstance: maplibregl.Map) => {
    if (allianceLoadedRef.current) return;
    if (mapInstance.getSource("alliance-countries")) return;
    allianceLoadedRef.current = true;

    fetch("/api/alliance")
      .then((r) => (r.ok ? r.json() : null))
      .then((data: GeoJSON.FeatureCollection | null) => {
        if (!data || !mapInstance.getStyle()) return;

        mapInstance.addSource("alliance-countries", {
          type: "geojson",
          data,
        });

        const hidden = { visibility: "none" as const };

        // Ukraine supporters — blue outline + subtle fill
        mapInstance.addLayer({
          id: "alliance-ukraine-fill",
          type: "fill",
          source: "alliance-countries",
          filter: ["==", ["get", "side"], "ukraine"],
          layout: hidden,
          paint: {
            "fill-color": "#005BBB",
            "fill-opacity": 0.08,
          },
        });
        mapInstance.addLayer({
          id: "alliance-ukraine-line",
          type: "line",
          source: "alliance-countries",
          filter: ["==", ["get", "side"], "ukraine"],
          layout: hidden,
          paint: {
            "line-color": "#4a9ad4",
            "line-width": 1.5,
            "line-opacity": 0.7,
          },
        });

        // Russia supporters — red outline + subtle fill
        mapInstance.addLayer({
          id: "alliance-russia-fill",
          type: "fill",
          source: "alliance-countries",
          filter: ["==", ["get", "side"], "russia"],
          layout: hidden,
          paint: {
            "fill-color": "#C53030",
            "fill-opacity": 0.08,
          },
        });
        mapInstance.addLayer({
          id: "alliance-russia-line",
          type: "line",
          source: "alliance-countries",
          filter: ["==", ["get", "side"], "russia"],
          layout: hidden,
          paint: {
            "line-color": "#e85454",
            "line-width": 1.5,
            "line-opacity": 0.7,
          },
        });

        // Apply current visibility
        const vis = layersRef.current.alliance ? "visible" : "none";
        for (const id of [
          "alliance-ukraine-fill",
          "alliance-ukraine-line",
          "alliance-russia-fill",
          "alliance-russia-line",
        ]) {
          mapInstance.setLayoutProperty(id, "visibility", vis);
        }
      })
      .catch(() => {});
  }, []);

  const ensureViinaLayers = useCallback((mapInstance: maplibregl.Map) => {
    if (mapInstance.getSource("viina-territory")) return;

    mapInstance.addSource("viina-territory", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // All layers start hidden to prevent flash; visibility set after data loads
    const hidden = { visibility: "none" as const };

    // RU-controlled territory fill (matching DeepState style)
    mapInstance.addLayer({
      id: "viina-ru",
      type: "fill",
      source: "viina-territory",
      filter: ["all", ["==", ["get", "status"], "RU"], ["==", ["geometry-type"], "Polygon"]],
      layout: hidden,
      paint: {
        "fill-color": "#c53030",
        "fill-opacity": 0.3,
      },
    });

    // Contested territory fill
    mapInstance.addLayer({
      id: "viina-contested",
      type: "fill",
      source: "viina-territory",
      filter: ["all", ["==", ["get", "status"], "CONTESTED"], ["==", ["geometry-type"], "Polygon"]],
      layout: hidden,
      paint: {
        "fill-color": "#eab308",
        "fill-opacity": 0.25,
      },
    });

    // Fallback circles for any points without tessellation
    mapInstance.addLayer({
      id: "viina-ru-pts",
      type: "circle",
      source: "viina-territory",
      filter: ["all", ["==", ["get", "status"], "RU"], ["==", ["geometry-type"], "Point"]],
      layout: hidden,
      paint: {
        "circle-color": "#c53030",
        "circle-opacity": 0.45,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2, 6, 4, 8, 8, 10, 14],
        "circle-blur": 0.3,
      },
    });

    mapInstance.addLayer({
      id: "viina-contested-pts",
      type: "circle",
      source: "viina-territory",
      filter: ["all", ["==", ["get", "status"], "CONTESTED"], ["==", ["geometry-type"], "Point"]],
      layout: hidden,
      paint: {
        "circle-color": "#eab308",
        "circle-opacity": 0.5,
        "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 2, 6, 4, 8, 8, 10, 14],
        "circle-blur": 0.2,
      },
    });

    // VIINA frontline — dashed line matching DeepState territory-line style
    mapInstance.addLayer({
      id: "viina-frontline",
      type: "line",
      source: "viina-territory",
      filter: ["==", ["get", "type"], "frontline"],
      layout: hidden,
      paint: {
        "line-color": "#ff4444",
        "line-width": 2.5,
        "line-opacity": 0.85,
        "line-dasharray": [3, 2],
      },
    });
  }, []);

  // Track the last territory date we started loading to avoid redundant fetches
  const lastTerritoryFetchRef = useRef<string | null | undefined>(null);
  const territoryAbortRef = useRef<AbortController | null>(null);

  const loadTerritoryData = useCallback(
    async (mapInstance: maplibregl.Map) => {
      const useViina = territoryDate && territoryDate < DEEPSTATE_START;
      const fetchKey = `${territoryDate ?? "latest"}:${useViina ? "viina" : "deepstate"}`;

      // Skip if already successfully loaded this exact date+source combo
      if (lastTerritoryFetchRef.current === fetchKey) return;

      // Abort previous in-flight territory fetch only now (when a new one fires)
      territoryAbortRef.current?.abort();
      const controller = new AbortController();
      territoryAbortRef.current = controller;
      lastTerritoryFetchRef.current = fetchKey;

      // Helper: set visibility on VIINA layers if they exist
      const setViinaVisibility = (vis: "visible" | "none") => {
        for (const id of ["viina-ru", "viina-contested", "viina-ru-pts", "viina-contested-pts"]) {
          if (mapInstance.getLayer(id)) mapInstance.setLayoutProperty(id, "visibility", vis);
        }
        if (mapInstance.getLayer("viina-frontline")) {
          mapInstance.setLayoutProperty(
            "viina-frontline",
            "visibility",
            vis === "visible" && layersRef.current.frontline ? "visible" : "none",
          );
        }
      };

      // Helper: set visibility on DeepState layers if they exist
      const setDeepStateVisibility = (vis: "visible" | "none") => {
        if (mapInstance.getLayer("territory-fill"))
          mapInstance.setLayoutProperty("territory-fill", "visibility", vis);
        if (mapInstance.getLayer("territory-line")) {
          mapInstance.setLayoutProperty(
            "territory-line",
            "visibility",
            vis === "visible" && layersRef.current.frontline ? "visible" : "none",
          );
        }
      };

      try {
        if (useViina) {
          const res = await fetch(`/api/territory/viina?date=${territoryDate}`, {
            signal: controller.signal,
          });

          if (!mapInstance.isStyleLoaded()) {
            if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
            return;
          }

          ensureViinaLayers(mapInstance);
          const viinaSource = mapInstance.getSource("viina-territory") as
            | maplibregl.GeoJSONSource
            | undefined;

          if (!res.ok || !viinaSource) {
            if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
            return;
          }
          const { geojson } = await res.json();
          viinaSource.setData(geojson);

          // Clear DeepState data and hide its layers
          const deepstateSource = mapInstance.getSource("territory") as
            | maplibregl.GeoJSONSource
            | undefined;
          if (deepstateSource) {
            deepstateSource.setData({ type: "FeatureCollection", features: [] });
          }
          setDeepStateVisibility("none");

          // Show VIINA layers (respecting user's territory toggle)
          setViinaVisibility(layersRef.current.territory ? "visible" : "none");
          return;
        }

        // DeepState territory (July 2024+)
        const url = territoryDate ? `/api/territory/${territoryDate}` : "/api/territory";
        const res = await fetch(url, { signal: controller.signal });

        if (!mapInstance.isStyleLoaded()) {
          if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
          return;
        }

        const existingSource = mapInstance.getSource("territory") as
          | maplibregl.GeoJSONSource
          | undefined;

        if (!res.ok) {
          if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
          return;
        }
        const { geojson } = await res.json();

        if (existingSource) {
          existingSource.setData(geojson);

          // Clear VIINA data and hide its layers
          const viinaSource = mapInstance.getSource("viina-territory") as
            | maplibregl.GeoJSONSource
            | undefined;
          if (viinaSource) {
            viinaSource.setData({ type: "FeatureCollection", features: [] });
          }
          setViinaVisibility("none");

          // Re-show DeepState layers (respecting user's territory toggle)
          setDeepStateVisibility(layersRef.current.territory ? "visible" : "none");
          return;
        }

        if (mapInstance.getSource("territory")) return;

        mapInstance.addSource("territory", {
          type: "geojson",
          data: geojson,
        });

        // Occupied territory fill
        mapInstance.addLayer({
          id: "territory-fill",
          type: "fill",
          source: "territory",
          paint: {
            "fill-color": "#c53030",
            "fill-opacity": 0.3,
          },
        });

        // Frontline border
        mapInstance.addLayer({
          id: "territory-line",
          type: "line",
          source: "territory",
          paint: {
            "line-color": "#ff4444",
            "line-width": 2.5,
            "line-opacity": 0.85,
            "line-dasharray": [3, 2],
          },
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          // Only reset if this was still the active fetch (prevents race with newer fetch)
          if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
          return;
        }
        if (lastTerritoryFetchRef.current === fetchKey) lastTerritoryFetchRef.current = null;
        console.error("Failed to load territory data:", err);
      }
    },
    [territoryDate, ensureViinaLayers],
  );

  const loadEquipmentData = useCallback(
    async (mapInstance: maplibregl.Map) => {
      try {
        const res = await fetch("/api/losses/recent");
        if (!res.ok) return;
        const data = await res.json();

        // Parse geo-tagged losses into markers
        const markers: EquipmentMarker[] = (data.losses || [])
          .filter((l: { geo?: string | null }) => l.geo?.includes(","))
          .map(
            (l: {
              id: number;
              type: string;
              model: string;
              status: string;
              date: string;
              nearest_location: string | null;
              geo: string;
            }) => {
              const [lat, lng] = l.geo.split(",").map(Number);
              return {
                id: l.id,
                type: l.type,
                model: l.model,
                status: l.status,
                date: l.date,
                location: l.nearest_location,
                lat,
                lng,
                category: normalizeEquipmentCategory(l.type),
              };
            },
          )
          .filter(
            (m: { lat: number; lng: number }) => !Number.isNaN(m.lat) && !Number.isNaN(m.lng),
          );

        equipmentDataRef.current = markers;

        // Guard: map may have been removed during await (React Strict Mode)
        if (map.current !== mapInstance) return;
        if (mapInstance.getSource("equipment")) return;

        // Create GeoJSON from markers
        const geojson: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: markers.map((m: EquipmentMarker) => ({
            type: "Feature" as const,
            geometry: {
              type: "Point" as const,
              coordinates: [m.lng, m.lat],
            },
            properties: {
              id: m.id,
              type: m.type,
              model: m.model,
              status: m.status,
              date: m.date,
              location: m.location || "",
              category: m.category || normalizeEquipmentCategory(m.type),
            },
          })),
        };

        mapInstance.addSource("equipment", {
          type: "geojson",
          data: geojson,
          cluster: true,
          clusterMaxZoom: 12,
          clusterRadius: 50,
        });

        // Cluster circles
        mapInstance.addLayer({
          id: "equipment-clusters",
          type: "circle",
          source: "equipment",
          filter: ["has", "point_count"],
          paint: {
            "circle-color": [
              "step",
              ["get", "point_count"],
              "#e53e3e",
              5,
              "#ed8936",
              15,
              "#c53030",
            ],
            "circle-radius": ["step", ["get", "point_count"], 16, 5, 22, 15, 28],
            "circle-opacity": 0.85,
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(229, 62, 62, 0.3)",
          },
        });

        // Cluster count labels
        mapInstance.addLayer({
          id: "equipment-cluster-count",
          type: "symbol",
          source: "equipment",
          filter: ["has", "point_count"],
          layout: {
            "text-field": "{point_count_abbreviated}",
            "text-size": 11,
            "text-font": ["Open Sans Bold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Individual markers — category icons at all zoom levels
        loadEquipmentIcons(mapInstance);

        mapInstance.addLayer({
          id: "equipment-icons",
          type: "symbol",
          source: "equipment",
          filter: ["!", ["has", "point_count"]],
          layout: {
            "icon-image": [
              "concat",
              "equip-",
              ["get", "category"],
              "-",
              ["get", "status"],
            ] as unknown as maplibregl.ExpressionSpecification,
            "icon-size": [
              "interpolate",
              ["linear"],
              ["zoom"],
              5,
              0.6,
              10,
              0.8,
              14,
              1,
            ] as unknown as maplibregl.ExpressionSpecification,
            "icon-allow-overlap": true,
            "icon-ignore-placement": false,
            "icon-padding": 2,
          },
        });

        // Click individual markers
        mapInstance.on("click", "equipment-icons", (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties;
          if (!props) return;

          const marker: EquipmentMarker = {
            id: props.id,
            type: props.type,
            model: props.model,
            status: props.status,
            date: props.date,
            location: props.location || null,
            lat: (e.features[0].geometry as GeoJSON.Point).coordinates[1],
            lng: (e.features[0].geometry as GeoJSON.Point).coordinates[0],
          };

          onMarkerClick?.(marker);
        });

        // Click clusters to zoom
        mapInstance.on("click", "equipment-clusters", async (e) => {
          const features = mapInstance.queryRenderedFeatures(e.point, {
            layers: ["equipment-clusters"],
          });
          if (!features.length) return;
          const clusterId = features[0].properties?.cluster_id;
          const source = mapInstance.getSource("equipment") as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            mapInstance.easeTo({
              center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
              zoom,
            });
          } catch {
            // ignore cluster zoom errors
          }
        });

        // Cursor changes
        mapInstance.on("mouseenter", "equipment-icons", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "equipment-icons", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
        mapInstance.on("mouseenter", "equipment-clusters", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "equipment-clusters", () => {
          mapInstance.getCanvas().style.cursor = "";
        });

        // Hover tooltips for individual points and icons
        const showEquipmentTooltip = (
          e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] },
        ) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties;
          if (!props) return;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

          popupRef.current?.remove();
          popupRef.current = new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 10,
            className: "equipment-popup",
          })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px;color:#e8e8ed;line-height:1.4">
                <strong>${props.model}</strong><br/>
                <span style="color:${STATUS_COLORS[props.status] || "#888"};text-transform:capitalize">${props.status}</span>
                <span style="color:#8888a0"> · ${formatISODate(props.date || "")}</span>
              </div>`,
            )
            .addTo(mapInstance);
        };

        const hideEquipmentTooltip = () => {
          popupRef.current?.remove();
          popupRef.current = null;
        };

        mapInstance.on("mouseenter", "equipment-icons", showEquipmentTooltip);
        mapInstance.on("mouseleave", "equipment-icons", hideEquipmentTooltip);
      } catch (err) {
        console.error("Failed to load equipment data:", err);
      }
    },
    [onMarkerClick],
  );

  // Load ACLED conflict event data
  const loadAcledData = useCallback(async (mapInstance: maplibregl.Map) => {
    try {
      const res = await fetch("/api/acled");
      if (!res.ok) return;
      const geojson: GeoJSON.FeatureCollection = await res.json();
      if (!geojson.features) return;

      acledDataRef.current = geojson;

      // Guard: map may have been removed during await (React Strict Mode)
      if (map.current !== mapInstance) return;
      if (mapInstance.getSource("acled")) return;

      mapInstance.addSource("acled", {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterMaxZoom: 11,
        clusterRadius: 40,
      });

      loadConflictIcons(mapInstance);

      // Cluster circles — warm purple tint
      const conflictsVis = layersRef.current.conflicts ? "visible" : "none";

      mapInstance.addLayer({
        id: "acled-clusters",
        type: "circle",
        source: "acled",
        filter: ["has", "point_count"],
        layout: { visibility: conflictsVis as "visible" | "none" },
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#a855f7",
            20,
            "#9333ea",
            100,
            "#7e22ce",
          ],
          "circle-radius": ["step", ["get", "point_count"], 14, 20, 20, 100, 26],
          "circle-opacity": 0.8,
          "circle-stroke-width": 2,
          "circle-stroke-color": "rgba(168, 85, 247, 0.3)",
        },
      });

      // Cluster count labels
      mapInstance.addLayer({
        id: "acled-cluster-count",
        type: "symbol",
        source: "acled",
        filter: ["has", "point_count"],
        layout: {
          visibility: conflictsVis as "visible" | "none",
          "text-field": "{point_count_abbreviated}",
          "text-size": 10,
          "text-font": ["Open Sans Bold"],
        },
        paint: {
          "text-color": "#ffffff",
        },
      });

      // Individual event points — icon by event type
      mapInstance.addLayer({
        id: "acled-points",
        type: "symbol",
        source: "acled",
        filter: ["!", ["has", "point_count"]],
        layout: {
          visibility: conflictsVis as "visible" | "none",
          "icon-image": [
            "match",
            ["get", "type"],
            "Battles",
            "conflict-battle",
            "Explosions/Remote violence",
            "conflict-explosion",
            "Violence against civilians",
            "conflict-civilian",
            "Strategic developments",
            "conflict-strategic",
            "Protests",
            "conflict-protest",
            "Riots",
            "conflict-riot",
            "conflict-battle",
          ],
          "icon-size": [
            "interpolate",
            ["linear"],
            ["get", "fatalities"],
            0,
            0.6,
            5,
            0.8,
            20,
            1.0,
            100,
            1.3,
          ],
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-opacity": 0.85,
        },
      });

      // Click clusters to zoom
      mapInstance.on("click", "acled-clusters", async (e) => {
        const features = mapInstance.queryRenderedFeatures(e.point, {
          layers: ["acled-clusters"],
        });
        if (!features.length) return;
        const clusterId = features[0].properties?.cluster_id;
        const source = mapInstance.getSource("acled") as maplibregl.GeoJSONSource;
        try {
          const zoom = await source.getClusterExpansionZoom(clusterId);
          mapInstance.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        } catch {
          // ignore cluster zoom errors
        }
      });

      // Hover tooltips for individual conflict events
      mapInstance.on("mouseenter", "acled-points", (e) => {
        mapInstance.getCanvas().style.cursor = "pointer";
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (!props) return;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

        const eventColor = ACLED_EVENT_COLORS[props.type] || "#888";
        const fatalities = parseInt(props.fatalities, 10) || 0;

        acledPopupRef.current?.remove();
        acledPopupRef.current = new maplibregl.Popup({
          closeButton: false,
          closeOnClick: false,
          offset: 10,
          className: "acled-popup",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-size:12px;color:#e8e8ed;line-height:1.4;max-width:240px">
                <strong style="color:${eventColor}">${props.type}</strong><br/>
                <span style="color:#ccc">${props.subtype || ""}</span><br/>
                <span style="color:#8888a0">${props.location} · ${formatISODate(props.date || "")}</span>
                ${fatalities > 0 ? `<br/><span style="color:#ef4444">⚔ ${fatalities} fatalities</span>` : ""}
              </div>`,
          )
          .addTo(mapInstance);
      });

      mapInstance.on("mouseleave", "acled-points", () => {
        mapInstance.getCanvas().style.cursor = "";
        acledPopupRef.current?.remove();
        acledPopupRef.current = null;
      });

      // Click conflict event → jump timeline to that date
      mapInstance.on("click", "acled-points", (e) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties;
        if (!props?.date) return;
        // ACLED date is YYYY-MM-DD, timeline expects YYYYMMDD
        const timelineDate = props.date.replace(/-/g, "");
        onDateChangeRef.current?.(timelineDate);
      });

      // Cursor changes for clusters
      mapInstance.on("mouseenter", "acled-clusters", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "acled-clusters", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
    } catch (err) {
      console.error("Failed to load ACLED data:", err);
    }
  }, []);

  // Load battle markers as a map layer
  const loadBattleMarkers = useCallback((mapInstance: maplibregl.Map, battleData: Battle[]) => {
    if (mapInstance.getSource("battles")) {
      const src = mapInstance.getSource("battles") as maplibregl.GeoJSONSource;
      src.setData(battleGeoJSON(battleData));
      return;
    }

    mapInstance.addSource("battles", {
      type: "geojson",
      data: battleGeoJSON(battleData),
    });

    loadConflictIcons(mapInstance);

    // Outer glow ring
    mapInstance.addLayer({
      id: "battle-glow",
      type: "circle",
      source: "battles",
      paint: {
        "circle-radius": ["match", ["get", "significance"], "critical", 16, "major", 12, 8],
        "circle-color": ["case", ["get", "active"], "#ef4444", "rgba(239, 68, 68, 0.3)"],
        "circle-opacity": ["case", ["get", "active"], 0.3, 0.15],
        "circle-blur": 0.8,
      },
    });

    // Inner point — icon by significance
    mapInstance.addLayer({
      id: "battle-points",
      type: "symbol",
      source: "battles",
      layout: {
        "icon-image": [
          "match",
          ["get", "significance"],
          "critical",
          "battle-critical",
          "major",
          "battle-major",
          "battle-minor",
        ],
        "icon-size": ["match", ["get", "significance"], "critical", 1.2, "major", 1.0, 0.8],
        "icon-allow-overlap": true,
        "icon-ignore-placement": true,
      },
      paint: {
        "icon-opacity": ["case", ["get", "active"], 0.9, 0.5],
      },
    });

    // Battle name labels
    mapInstance.addLayer({
      id: "battle-labels",
      type: "symbol",
      source: "battles",
      layout: {
        "text-field": ["get", "name"],
        "text-size": 10,
        "text-offset": [0, 1.5],
        "text-anchor": "top",
        "text-allow-overlap": false,
        "text-font": ["Open Sans Semibold"],
      },
      paint: {
        "text-color": ["case", ["get", "active"], "#fca5a5", "#9ca3af"],
        "text-halo-color": "rgba(0, 0, 0, 0.8)",
        "text-halo-width": 1.5,
      },
    });

    // Click handler for battle popup
    mapInstance.on("click", "battle-points", (e) => {
      if (!e.features?.length) return;
      const f = e.features[0];
      const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
      const props = f.properties || {};

      battlePopupRef.current?.remove();
      battlePopupRef.current = new maplibregl.Popup({
        closeOnClick: true,
        maxWidth: "260px",
        className: "battle-popup",
      })
        .setLngLat(coords)
        .setHTML(
          `<div style="max-width:280px">
              <div style="font-weight:700;font-size:13px;color:#fbbf24;margin-bottom:4px">${props.name}${props.source === "acled" ? ' <span style="font-size:9px;color:#9ca3af;font-weight:400;background:#374151;padding:1px 4px;border-radius:3px;vertical-align:middle">ACLED</span>' : ""}${props.isOngoing ? ' <span style="font-size:9px;color:#fbbf24;font-weight:400;background:#78350f;padding:1px 4px;border-radius:3px;vertical-align:middle">ONGOING</span>' : ""}</div>
              <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">${props.dateRange}</div>
              <div style="font-size:11px;color:#d1d5db;margin-bottom:6px;line-height:1.4">${props.description}</div>
              ${props.outcome ? `<div style="font-size:11px;color:#60a5fa;margin-bottom:4px"><strong>${t("map.outcome")}:</strong> ${props.outcome}</div>` : ""}
              ${props.fatalities > 0 ? `<div style="font-size:11px;color:#f87171;margin-bottom:4px"><strong>Fatalities:</strong> ${props.fatalities}</div>` : ""}
              <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${props.significance}</div>
            </div>`,
        )
        .addTo(mapInstance);
    });

    mapInstance.on("mouseenter", "battle-points", () => {
      mapInstance.getCanvas().style.cursor = "pointer";
    });
    mapInstance.on("mouseleave", "battle-points", () => {
      mapInstance.getCanvas().style.cursor = "";
    });
  }, []);

  // Create buildup camp icon (SDF) for mobilization markers
  const ensureBuildupIcon = useCallback((mapInstance: maplibregl.Map) => {
    if (mapInstance.hasImage("buildup-camp")) return;
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    // Draw a tent/camp shape
    ctx.beginPath();
    ctx.moveTo(size / 2, 4);
    ctx.lineTo(size - 4, size - 6);
    ctx.lineTo(4, size - 6);
    ctx.closePath();
    ctx.fill();
    // Draw base line
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(2, size - 6);
    ctx.lineTo(size - 2, size - 6);
    ctx.stroke();
    const imageData = ctx.getImageData(0, 0, size, size);
    mapInstance.addImage(
      "buildup-camp",
      { width: size, height: size, data: new Uint8Array(imageData.data.buffer) },
      { sdf: true },
    );
  }, []);

  // Create triangle arrowhead image for operation arrows
  const ensureArrowImage = useCallback((mapInstance: maplibregl.Map) => {
    if (mapInstance.hasImage("op-arrow")) return;
    const size = 24;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(size / 2, 2);
    ctx.lineTo(size - 3, size - 2);
    ctx.lineTo(3, size - 2);
    ctx.closePath();
    ctx.fill();
    const imageData = ctx.getImageData(0, 0, size, size);
    mapInstance.addImage(
      "op-arrow",
      { width: size, height: size, data: new Uint8Array(imageData.data.buffer) },
      { sdf: true },
    );
  }, []);

  // Load military operation arrow layers
  const loadOperationLayers = useCallback(
    (mapInstance: maplibregl.Map, ops: MilitaryOperation[]) => {
      ensureArrowImage(mapInstance);

      if (mapInstance.getSource("operations")) {
        const src = mapInstance.getSource("operations") as maplibregl.GeoJSONSource;
        src.setData(operationsGeoJSON(ops));
        const arrowSrc = mapInstance.getSource("operation-arrows") as maplibregl.GeoJSONSource;
        arrowSrc?.setData(operationArrowheadsGeoJSON(ops));
        return;
      }

      // Line source (arrow body)
      mapInstance.addSource("operations", {
        type: "geojson",
        data: operationsGeoJSON(ops),
      });

      // Arrowhead point source
      mapInstance.addSource("operation-arrows", {
        type: "geojson",
        data: operationArrowheadsGeoJSON(ops),
      });

      // Glow/shadow behind the arrow line
      mapInstance.addLayer({
        id: "operation-line-glow",
        type: "line",
        source: "operations",
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": [
            "case",
            ["==", ["get", "side"], "ukraine"],
            "rgba(34, 211, 238, 0.3)",
            "rgba(251, 146, 60, 0.3)",
          ],
          "line-width": ["case", ["get", "active"], 14, 8],
          "line-blur": 6,
          "line-opacity": ["case", ["get", "active"], 0.7, 0.3],
        },
      });

      // Main arrow line (advances — solid)
      mapInstance.addLayer({
        id: "operation-lines",
        type: "line",
        source: "operations",
        filter: ["all", ["!=", ["get", "type"], "retreat"], ["!", ["get", "isOngoing"]]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["case", ["==", ["get", "side"], "ukraine"], "#22d3ee", "#fb923c"],
          "line-width": ["case", ["get", "active"], 4, 2.5],
          "line-opacity": ["case", ["get", "active"], 0.95, 0.5],
        },
      });

      // Ongoing operation lines (dashed to indicate projected / still active)
      mapInstance.addLayer({
        id: "operation-lines-ongoing",
        type: "line",
        source: "operations",
        filter: ["all", ["!=", ["get", "type"], "retreat"], ["get", "isOngoing"]],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["case", ["==", ["get", "side"], "ukraine"], "#22d3ee", "#fb923c"],
          "line-width": ["case", ["get", "active"], 4, 2.5],
          "line-opacity": ["case", ["get", "active"], 0.75, 0.4],
          "line-dasharray": [6, 4],
        },
      });

      // Retreat lines (dashed)
      mapInstance.addLayer({
        id: "operation-lines-retreat",
        type: "line",
        source: "operations",
        filter: ["==", ["get", "type"], "retreat"],
        layout: {
          "line-cap": "round",
          "line-join": "round",
        },
        paint: {
          "line-color": ["case", ["==", ["get", "side"], "ukraine"], "#22d3ee", "#fb923c"],
          "line-width": ["case", ["get", "active"], 4, 2.5],
          "line-opacity": ["case", ["get", "active"], 0.95, 0.5],
          "line-dasharray": [4, 3],
        },
      });

      // Arrowhead symbols at the tip of each line
      mapInstance.addLayer({
        id: "operation-arrowheads",
        type: "symbol",
        source: "operation-arrows",
        layout: {
          "icon-image": "op-arrow",
          "icon-size": ["case", ["get", "active"], 0.7, 0.45],
          "icon-rotate": ["get", "bearing"],
          "icon-rotation-alignment": "map",
          "icon-allow-overlap": true,
          "icon-ignore-placement": true,
        },
        paint: {
          "icon-color": ["case", ["==", ["get", "side"], "ukraine"], "#22d3ee", "#fb923c"],
          "icon-opacity": ["case", ["get", "active"], 0.95, 0.5],
        },
      });

      // Operation name labels
      mapInstance.addLayer({
        id: "operation-labels",
        type: "symbol",
        source: "operations",
        layout: {
          "symbol-placement": "line-center",
          "text-field": ["get", "name"],
          "text-size": 11,
          "text-allow-overlap": false,
          "text-font": ["Open Sans Semibold"],
          "text-offset": [0, -1.2],
        },
        paint: {
          "text-color": [
            "case",
            ["get", "active"],
            [
              "case",
              ["==", ["get", "side"], "ukraine"],
              "#67e8f9", // bright cyan for active Ukraine
              "#fdba74", // bright orange for active Russia
            ],
            "#9ca3af",
          ],
          "text-halo-color": "rgba(0, 0, 0, 0.9)",
          "text-halo-width": 2,
          "text-opacity": ["case", ["get", "active"], 1, 0.6],
        },
      });

      // Click handler for operation popups
      const handleOperationClick = (
        e: maplibregl.MapMouseEvent & { features?: GeoJSON.Feature[] },
      ) => {
        if (!e.features?.length) return;
        const f = e.features[0];
        const props = f.properties || {};
        const coords = e.lngLat;

        const sideLabel = props.side === "ukraine" ? "Ukraine" : "Russia";
        const sideColor = props.side === "ukraine" ? "#22d3ee" : "#fb923c";
        const typeLabel = (props.type as string)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        operationPopupRef.current?.remove();
        operationPopupRef.current = new maplibregl.Popup({
          closeOnClick: true,
          maxWidth: "280px",
          className: "operation-popup",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="max-width:280px">
              <div style="font-weight:700;font-size:13px;color:${sideColor};margin-bottom:4px">${props.name}${props.isOngoing ? ' <span style="font-size:9px;color:#fbbf24;font-weight:400;background:#78350f;padding:1px 4px;border-radius:3px;vertical-align:middle">ONGOING</span>' : ""}</div>
              <div style="font-size:11px;color:#9ca3af;margin-bottom:2px">${props.dateRange}</div>
              <div style="display:flex;gap:6px;margin-bottom:6px">
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${sideColor}22;color:${sideColor};border:1px solid ${sideColor}44">${sideLabel}</span>
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:#9ca3af;border:1px solid rgba(255,255,255,0.12)">${typeLabel}</span>
              </div>
              <div style="font-size:11px;color:#d1d5db;margin-bottom:6px;line-height:1.4">${props.description}</div>
              ${props.outcome ? `<div style="font-size:11px;color:#60a5fa;margin-bottom:4px"><strong>${t("map.outcome")}:</strong> ${props.outcome}</div>` : ""}
            </div>`,
          )
          .addTo(mapInstance);

        // Jump timeline to operation's start date
        if (props.startDate) {
          onDateChangeRef.current?.(props.startDate as string);
        }
      };

      for (const layerId of [
        "operation-lines",
        "operation-lines-ongoing",
        "operation-lines-retreat",
      ]) {
        mapInstance.on("click", layerId, handleOperationClick);
        mapInstance.on("mouseenter", layerId, () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", layerId, () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }
    },
    [ensureArrowImage],
  );

  // ── Thermal Anomaly Layer (NASA FIRMS satellite detections) ──
  const thermalPopupRef = useRef<maplibregl.Popup | null>(null);
  const thermalDateRef = useRef<string | null>(null);
  const thermalCacheRef = useRef(new Map<string, GeoJSON.FeatureCollection>());

  /** Fetch thermal data for a given date and update the source, or create layers on first call */
  const loadThermalLayer = useCallback(async (mapInstance: maplibregl.Map, dateStr?: string) => {
    const dateKey = dateStr ?? "nrt";

    // If source already exists, just update the data
    const existingSource = mapInstance.getSource("thermal-anomalies") as
      | maplibregl.GeoJSONSource
      | undefined;
    if (existingSource) {
      // Skip if we already loaded this date
      if (thermalDateRef.current === dateKey) return;

      // Check client-side cache first (no network call)
      const clientCached = thermalCacheRef.current.get(dateKey);
      if (clientCached) {
        existingSource.setData(clientCached);
        thermalDateRef.current = dateKey;
        return;
      }

      try {
        const url = dateStr ? `/api/firms?date=${dateStr}` : "/api/firms";
        const res = await fetch(url);
        if (!res.ok) return;
        const geojson: GeoJSON.FeatureCollection = await res.json();
        thermalCacheRef.current.set(dateKey, geojson);
        // Evict old entries if cache grows too large (keep last 60 dates)
        if (thermalCacheRef.current.size > 60) {
          const first = thermalCacheRef.current.keys().next().value;
          if (first) thermalCacheRef.current.delete(first);
        }
        existingSource.setData(geojson);
        thermalDateRef.current = dateKey;
      } catch {
        /* keep existing data on error */
      }
      return;
    }

    try {
      const url = dateStr ? `/api/firms?date=${dateStr}` : "/api/firms";
      const res = await fetch(url);
      if (!res.ok) return;
      const geojson: GeoJSON.FeatureCollection = await res.json();
      if (!mapInstance.isStyleLoaded()) return;

      thermalCacheRef.current.set(dateKey, geojson);

      mapInstance.addSource("thermal-anomalies", {
        type: "geojson",
        data: geojson,
      });
      thermalDateRef.current = dateKey;

      // Outer glow — large, dim orange circle
      mapInstance.addLayer({
        id: "thermal-glow",
        type: "circle",
        source: "thermal-anomalies",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "frp"], 0, 12, 50, 24, 200, 40],
          "circle-color": "rgba(255, 120, 30, 0.15)",
          "circle-blur": 1,
        },
      });

      // Core point — bright orange/red sized by Fire Radiative Power
      mapInstance.addLayer({
        id: "thermal-points",
        type: "circle",
        source: "thermal-anomalies",
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["get", "frp"], 0, 3, 50, 6, 200, 12],
          "circle-color": [
            "interpolate",
            ["linear"],
            ["get", "frp"],
            0,
            "#ff8c00",
            50,
            "#ff4500",
            200,
            "#ff0000",
          ],
          "circle-opacity": 0.85,
          "circle-stroke-width": 1,
          "circle-stroke-color": "rgba(255, 200, 50, 0.5)",
        },
      });

      // Click handler for thermal anomaly details
      mapInstance.on("click", "thermal-points", (e) => {
        const feature = e.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;

        const props = feature.properties;
        const coords = feature.geometry.coordinates as [number, number];
        const frp = props?.frp ? Number(props.frp).toFixed(1) : "N/A";
        const confidence = props?.confidence || "unknown";
        const date = props?.date || "";
        const time = props?.time || "";
        const timeStr = time ? `${time.slice(0, 2)}:${time.slice(2)}` : "";

        thermalPopupRef.current?.remove();
        thermalPopupRef.current = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: "infrastructure-popup",
          maxWidth: "260px",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="font-family:var(--font-dm-sans);color:#e8e8ed;font-size:13px;">
              <div style="font-weight:600;color:#ff8c00;margin-bottom:6px;">${t("map.thermalAnomaly")}</div>
              <div style="color:#aaa;font-size:11px;margin-bottom:6px;">${date.includes("-") ? formatISODate(date) : date}${timeStr ? ` ${timeStr} UTC` : ""}</div>
              <div style="margin-bottom:4px;"><span style="color:#888;">${t("map.fireRadiativePower")}:</span> ${frp} MW</div>
              <div style="margin-bottom:4px;"><span style="color:#888;">${t("map.confidence")}:</span> ${confidence}</div>
              <div style="color:#666;font-size:10px;margin-top:6px;">${t("map.sourceFirms")}</div>
            </div>`,
          )
          .addTo(mapInstance);
      });

      mapInstance.on("mouseenter", "thermal-points", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "thermal-points", () => {
        mapInstance.getCanvas().style.cursor = "";
      });

      // Respect current visibility setting
      const vis = layersRef.current.thermal ? "visible" : "none";
      mapInstance.setLayoutProperty("thermal-glow", "visibility", vis);
      mapInstance.setLayoutProperty("thermal-points", "visibility", vis);
    } catch (err) {
      console.error("[MapView] Failed to load thermal anomaly data:", err);
    }
  }, []);

  // ── Infrastructure Layer (nuclear, dams, bridges, ports, power plants, gas stations) ──

  /** Build infrastructure GeoJSON features with date-aware status */
  const buildInfraFeatures = useCallback(
    (dateStr?: string | null): GeoJSON.Feature[] => {
      const features: GeoJSON.Feature[] = [];
      const d = dateStr ?? undefined;

      for (const npp of nuclearPlants) {
        const status = d ? getStatusAtDate(npp, d) : npp.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [npp.lng, npp.lat] },
          properties: {
            id: npp.id,
            name: npp.name,
            category: "nuclear",
            status,
            detail: `${npp.reactors}x ${npp.reactorType} — ${npp.capacityMW} MW`,
            description: npp.description,
            warContext: npp.warContext,
          },
        });
      }

      for (const dam of dams) {
        const status = d ? getStatusAtDate(dam, d) : dam.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [dam.lng, dam.lat] },
          properties: {
            id: dam.id,
            name: dam.name,
            category: "dam",
            status,
            detail: dam.capacityMW ? `${dam.capacityMW} MW hydroelectric` : "Reservoir dam",
            description: dam.warContext,
            warContext: dam.warContext,
          },
        });
      }

      for (const bridge of bridges) {
        const status = d ? getStatusAtDate(bridge, d) : bridge.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [bridge.lng, bridge.lat] },
          properties: {
            id: bridge.id,
            name: bridge.name,
            category: "bridge",
            status,
            detail: bridge.strategicValue,
            description: bridge.warContext,
            warContext: bridge.warContext,
          },
        });
      }

      for (const port of ports) {
        const status = d ? getStatusAtDate(port, d) : port.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [port.lng, port.lat] },
          properties: {
            id: port.id,
            name: port.name,
            category: "port",
            status,
            detail: `${port.portType === "river" ? "River" : "Sea"} port`,
            description: port.warContext,
            warContext: port.warContext,
          },
        });
      }

      for (const plant of powerPlants) {
        const status = d ? getStatusAtDate(plant, d) : plant.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [plant.lng, plant.lat] },
          properties: {
            id: plant.id,
            name: plant.name,
            category: "power-plant",
            status,
            detail: plant.capacityMW
              ? `${plant.capacityMW} MW ${plant.plantType}`
              : plant.plantType,
            description: plant.warContext,
            warContext: plant.warContext,
          },
        });
      }

      for (const station of gasStations) {
        const status = d ? getStatusAtDate(station, d) : station.status;
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [station.lng, station.lat] },
          properties: {
            id: station.id,
            name: station.name,
            category: "gas-station",
            status,
            detail: `Gas ${station.stationType} point`,
            description: station.description,
            warContext: station.description,
          },
        });
      }

      return features;
    },
    [nuclearPlants, dams, bridges, ports, powerPlants, gasStations],
  );

  const loadInfrastructureLayers = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (mapInstance.getSource("infrastructure")) return;

      const features = buildInfraFeatures(territoryDate);

      mapInstance.addSource("infrastructure", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      // Outer glow ring for nuclear plants
      mapInstance.addLayer({
        id: "infrastructure-nuclear-glow",
        type: "circle",
        source: "infrastructure",
        filter: ["==", ["get", "category"], "nuclear"],
        paint: {
          "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 8, 8, 16, 12, 24],
          "circle-color": [
            "case",
            ["==", ["get", "status"], "occupied"],
            "#ef4444",
            ["==", ["get", "status"], "decommissioned"],
            "#6b7280",
            "#22c55e",
          ],
          "circle-opacity": 0.15,
          "circle-blur": 0.8,
        },
      });

      // Register infrastructure icons
      loadInfrastructureIcons(mapInstance);

      // Main infrastructure point markers (symbol layer with icons)
      mapInstance.addLayer({
        id: "infrastructure-points",
        type: "symbol",
        source: "infrastructure",
        layout: {
          "icon-image": ["concat", "infra-", ["get", "category"], "-", ["get", "status"]],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.75, 10, 1],
          "icon-allow-overlap": true,
        },
      });

      // Infrastructure labels
      mapInstance.addLayer({
        id: "infrastructure-labels",
        type: "symbol",
        source: "infrastructure",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 5, 0, 7, 9, 10, 11],
          "text-offset": [0, 1.4],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-font": ["Open Sans Semibold"],
          "text-max-width": 10,
        },
        paint: {
          "text-color": "#d1d5db",
          "text-halo-color": "rgba(0, 0, 0, 0.85)",
          "text-halo-width": 1.5,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 5, 0, 7, 0.8, 10, 1],
        },
      });

      // Gas pipeline lines — active
      const pipelineFeatures: GeoJSON.Feature[] = gasPipelines.map((p) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: p.waypoints.map((wp) => [wp.lng, wp.lat]),
        },
        properties: {
          id: p.id,
          name: p.name,
          status: p.status,
          description: p.description,
        },
      }));

      mapInstance.addSource("gas-pipelines", {
        type: "geojson",
        data: { type: "FeatureCollection", features: pipelineFeatures },
      });

      mapInstance.addLayer({
        id: "gas-pipeline-lines",
        type: "line",
        source: "gas-pipelines",
        filter: ["!=", ["get", "status"], "shutdown"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": ["case", ["==", ["get", "status"], "destroyed"], "#ef4444", "#a855f7"],
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 8, 3, 12, 5],
          "line-opacity": 0.7,
        },
      });

      // Gas pipeline lines — shutdown (gray dashed)
      mapInstance.addLayer({
        id: "gas-pipeline-lines-shutdown",
        type: "line",
        source: "gas-pipelines",
        filter: ["==", ["get", "status"], "shutdown"],
        layout: { "line-cap": "round", "line-join": "round" },
        paint: {
          "line-color": "#6b7280",
          "line-width": ["interpolate", ["linear"], ["zoom"], 4, 1.5, 8, 3, 12, 5],
          "line-opacity": 0.7,
          "line-dasharray": [4, 3],
        },
      });

      mapInstance.addLayer({
        id: "gas-pipeline-labels",
        type: "symbol",
        source: "gas-pipelines",
        layout: {
          "symbol-placement": "line-center",
          "text-field": ["get", "name"],
          "text-size": 9,
          "text-font": ["Open Sans Semibold"],
          "text-offset": [0, -0.8],
        },
        paint: {
          "text-color": "#c4b5fd",
          "text-halo-color": "rgba(0, 0, 0, 0.85)",
          "text-halo-width": 1.5,
          "text-opacity": 0.8,
        },
      });

      // Click handler for infrastructure popups
      const handleInfraClick = (e: maplibregl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties || {};
        const coords = e.lngLat;

        const statusColors: Record<string, string> = {
          operational: "#22c55e",
          damaged: "#eab308",
          destroyed: "#ef4444",
          occupied: "#ef4444",
          decommissioned: "#6b7280",
          limited: "#eab308",
          shutdown: "#6b7280",
        };
        const statusColor = statusColors[props.status] || "#9ca3af";
        const categoryLabels: Record<string, string> = {
          nuclear: "Nuclear Plant",
          dam: "Dam",
          bridge: "Bridge",
          port: "Port",
          "power-plant": "Power Plant",
          "gas-station": "Gas Station",
        };
        const categoryLabel = categoryLabels[props.category] || props.category;

        infrastructurePopupRef.current?.remove();
        infrastructurePopupRef.current = new maplibregl.Popup({
          closeOnClick: true,
          maxWidth: "280px",
          className: "operation-popup",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="max-width:280px">
              <div style="font-weight:700;font-size:13px;color:${statusColor};margin-bottom:4px">${props.name}</div>
              <div style="display:flex;gap:6px;margin-bottom:6px">
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:#d1d5db;border:1px solid rgba(255,255,255,0.12)">${categoryLabel}</span>
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44">${props.status}</span>
              </div>
              ${props.detail ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${props.detail}</div>` : ""}
              <div style="font-size:11px;color:#d1d5db;line-height:1.4">${props.description}</div>
            </div>`,
          )
          .addTo(mapInstance);
      };

      mapInstance.on("click", "infrastructure-points", handleInfraClick);
      mapInstance.on("mouseenter", "infrastructure-points", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "infrastructure-points", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
    },
    [buildInfraFeatures, territoryDate, gasPipelines],
  );

  // ── NATO & Belarus Layer ──
  const loadNATOBelarusLayers = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (mapInstance.getSource("nato-belarus")) return;

      const features: GeoJSON.Feature[] = [];

      for (const base of natoBases) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [base.lng, base.lat] },
          properties: {
            id: base.id,
            name: base.name,
            side: "nato",
            country: base.country,
            baseType: base.baseType,
            framework: base.frameworkNation || "",
            description: base.description,
            significance: base.significance,
          },
        });
      }

      for (const base of belarusBases) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [base.lng, base.lat] },
          properties: {
            id: base.id,
            name: base.name,
            side: "belarus",
            baseType: base.baseType,
            description: base.significance,
            significance: base.warContext,
          },
        });
      }

      mapInstance.addSource("nato-belarus", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      // Register NATO/Belarus icons
      loadInfrastructureIcons(mapInstance);

      // NATO markers — symbol layer with compass star icon
      mapInstance.addLayer({
        id: "nato-points",
        type: "symbol",
        source: "nato-belarus",
        filter: ["==", ["get", "side"], "nato"],
        layout: {
          "icon-image": "nato-base",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.75, 10, 1],
          "icon-allow-overlap": true,
        },
      });

      // Belarus markers — symbol layer with military star icon
      mapInstance.addLayer({
        id: "belarus-points",
        type: "symbol",
        source: "nato-belarus",
        filter: ["==", ["get", "side"], "belarus"],
        layout: {
          "icon-image": "belarus-base",
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.75, 10, 1],
          "icon-allow-overlap": true,
        },
      });

      // NATO/Belarus labels
      mapInstance.addLayer({
        id: "nato-belarus-labels",
        type: "symbol",
        source: "nato-belarus",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 8, 10, 10],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-font": ["Open Sans Semibold"],
          "text-max-width": 10,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "side"], "nato"], "#93c5fd", "#fca5a5"],
          "text-halo-color": "rgba(0, 0, 0, 0.85)",
          "text-halo-width": 1.5,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 0.7, 10, 1],
        },
      });

      // Click handler
      const handleNATOClick = (e: maplibregl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties || {};
        const coords = e.lngLat;

        const isNATO = props.side === "nato";
        const color = isNATO ? "#60a5fa" : "#b91c1c";
        const sideLabel = isNATO ? "NATO" : "Belarus";
        const typeLabel = (props.baseType as string)
          .replace(/-/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());

        natoPopupRef.current?.remove();
        natoPopupRef.current = new maplibregl.Popup({
          closeOnClick: true,
          maxWidth: "280px",
          className: "operation-popup",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="max-width:280px">
              <div style="font-weight:700;font-size:13px;color:${color};margin-bottom:4px">${props.name}</div>
              <div style="display:flex;gap:6px;margin-bottom:6px">
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}44">${sideLabel}</span>
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:#9ca3af;border:1px solid rgba(255,255,255,0.12)">${typeLabel}</span>
                ${isNATO && props.country ? `<span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:#d1d5db;border:1px solid rgba(255,255,255,0.12)">${props.country}</span>` : ""}
              </div>
              ${isNATO && props.framework ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${t("map.frameworkNation")}: ${props.framework}</div>` : ""}
              <div style="font-size:11px;color:#d1d5db;line-height:1.4">${props.description}</div>
              ${props.significance ? `<div style="font-size:11px;color:#60a5fa;margin-top:4px">${props.significance}</div>` : ""}
            </div>`,
          )
          .addTo(mapInstance);
      };

      for (const layerId of ["nato-points", "belarus-points"]) {
        mapInstance.on("click", layerId, handleNATOClick);
        mapInstance.on("mouseenter", layerId, () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", layerId, () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }
    },
    [natoBases, belarusBases],
  );

  const loadMilitaryBaseLayers = useCallback(
    (mapInstance: maplibregl.Map) => {
      if (mapInstance.getSource("military-bases")) return;
      loadInfrastructureIcons(mapInstance);

      const features: GeoJSON.Feature[] = [];

      for (const base of ukraineBases) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [base.lng, base.lat] },
          properties: {
            id: base.id,
            name: base.name,
            side: "ukraine",
            baseType: base.type,
            branch: base.branch,
            description: base.description,
            status: base.status,
          },
        });
      }

      for (const base of russiaBases) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [base.lng, base.lat] },
          properties: {
            name: base.name,
            side: "russia",
            baseType: base.type,
            district: base.district,
            description: base.description,
            status: base.status,
          },
        });
      }

      mapInstance.addSource("military-bases", {
        type: "geojson",
        data: { type: "FeatureCollection", features },
      });

      // Ukraine base markers — shield icons
      mapInstance.addLayer({
        id: "ukraine-base-points",
        type: "symbol",
        source: "military-bases",
        filter: ["==", ["get", "side"], "ukraine"],
        layout: {
          "icon-image": ["concat", "ukraine-base-", ["get", "status"]],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.75, 10, 1],
          "icon-allow-overlap": true,
        },
      });

      // Russia base markers — star icons
      mapInstance.addLayer({
        id: "russia-base-points",
        type: "symbol",
        source: "military-bases",
        filter: ["==", ["get", "side"], "russia"],
        layout: {
          "icon-image": ["concat", "russia-base-", ["get", "status"]],
          "icon-size": ["interpolate", ["linear"], ["zoom"], 3, 0.5, 6, 0.75, 10, 1],
          "icon-allow-overlap": true,
        },
      });

      // Military base labels
      mapInstance.addLayer({
        id: "military-base-labels",
        type: "symbol",
        source: "military-bases",
        layout: {
          "text-field": ["get", "name"],
          "text-size": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 8, 10, 10],
          "text-offset": [0, 1.2],
          "text-anchor": "top",
          "text-allow-overlap": false,
          "text-font": ["Open Sans Semibold"],
          "text-max-width": 10,
        },
        paint: {
          "text-color": ["case", ["==", ["get", "side"], "ukraine"], "#93c5fd", "#fca5a5"],
          "text-halo-color": "rgba(0, 0, 0, 0.85)",
          "text-halo-width": 1.5,
          "text-opacity": ["interpolate", ["linear"], ["zoom"], 4, 0, 6, 0.7, 10, 1],
        },
      });

      const statusColors: Record<string, string> = {
        active: "#48BB78",
        destroyed: "#E53E3E",
        damaged: "#ED8936",
        occupied: "#C53030",
        relocated: "#3D8FD6",
      };

      const handleBaseClick = (e: maplibregl.MapMouseEvent & { features?: GeoJSON.Feature[] }) => {
        if (!e.features?.length) return;
        const props = e.features[0].properties || {};
        const coords = e.lngLat;

        const isUkraine = props.side === "ukraine";
        const color = isUkraine ? "#005BBB" : "#C53030";
        const sideLabel = isUkraine ? "🇺🇦 Ukraine" : "🇷🇺 Russia";
        const typeLabel = (props.baseType as string)
          .replace(/_/g, " ")
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        const statusColor = statusColors[props.status as string] || "#9ca3af";
        const statusLabel = (props.status as string).replace(/\b\w/g, (c: string) =>
          c.toUpperCase(),
        );
        const affiliationLabel = isUkraine
          ? props.branch
            ? `Branch: ${props.branch}`
            : ""
          : props.district
            ? `District: ${props.district}`
            : "";

        militaryBasePopupRef.current?.remove();
        militaryBasePopupRef.current = new maplibregl.Popup({
          closeOnClick: true,
          maxWidth: "280px",
          className: "operation-popup",
        })
          .setLngLat(coords)
          .setHTML(
            `<div style="max-width:280px">
              <div style="font-weight:700;font-size:13px;color:${color};margin-bottom:4px">${props.name}</div>
              <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${color}22;color:${color};border:1px solid ${color}44">${sideLabel}</span>
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:rgba(255,255,255,0.08);color:#9ca3af;border:1px solid rgba(255,255,255,0.12)">${typeLabel}</span>
                <span style="font-size:10px;padding:1px 6px;border-radius:3px;background:${statusColor}22;color:${statusColor};border:1px solid ${statusColor}44">${statusLabel}</span>
              </div>
              ${affiliationLabel ? `<div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${affiliationLabel}</div>` : ""}
              <div style="font-size:11px;color:#d1d5db;line-height:1.4">${props.description}</div>
            </div>`,
          )
          .addTo(mapInstance);
      };

      for (const layerId of ["ukraine-base-points", "russia-base-points"]) {
        mapInstance.on("click", layerId, handleBaseClick);
        mapInstance.on("mouseenter", layerId, () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", layerId, () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }
    },
    [ukraineBases, russiaBases],
  );

  // Load ACLED regional heatmap (choropleth by oblast)
  const loadAcledHeatmap = useCallback(async (mapInstance: maplibregl.Map) => {
    try {
      const res = await fetch("/api/acled/regional");
      if (!res.ok) return;
      const data: AcledRegionalData = await res.json();
      acledRegionalRef.current = data;

      // Guard: map may have been removed during await (React Strict Mode)
      if (map.current !== mapInstance) return;

      // Create oblast boundaries with event data
      const oblasts = oblastsRef.current;
      if (!oblasts) return;
      const oblastFeatures = oblasts.features;
      const geoWithData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: oblastFeatures.map((f) => {
          const name = (f.properties as { name: string }).name;
          const oblastData = data.oblasts.find((o) => o.name === name);
          const total = oblastData?.monthly
            ? oblastData.monthly
                .filter((m) => m.year >= 2022)
                .reduce((sum, m) => sum + m.fatalities, 0)
            : 0;
          return {
            ...f,
            properties: {
              ...f.properties,
              fatalities: total,
              events: oblastData?.monthly
                ? oblastData.monthly
                    .filter((m) => m.year >= 2022)
                    .reduce((sum, m) => sum + m.events, 0)
                : 0,
            },
          };
        }),
      };

      if (!mapInstance.getSource("acled-heatmap")) {
        mapInstance.addSource("acled-heatmap", {
          type: "geojson",
          data: geoWithData,
        });

        const heatmapVis = layersRef.current.heatmap ? "visible" : "none";

        // Add heatmap fill at the top of the layer stack so it renders above
        // the territory overlay and border mask (both are also fill layers).
        // Without this, the choropleth is hidden beneath opaque fills.
        mapInstance.addLayer({
          id: "acled-heatmap-fill",
          type: "fill",
          source: "acled-heatmap",
          layout: { visibility: heatmapVis as "visible" | "none" },
          paint: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "fatalities"],
              0,
              "rgba(0, 0, 0, 0)",
              100,
              "rgba(239, 68, 68, 0.08)",
              1000,
              "rgba(239, 68, 68, 0.15)",
              5000,
              "rgba(239, 68, 68, 0.25)",
              20000,
              "rgba(239, 68, 68, 0.4)",
              50000,
              "rgba(239, 68, 68, 0.55)",
            ],
            "fill-opacity": 0.7,
          },
        });

        mapInstance.addLayer({
          id: "acled-heatmap-line",
          type: "line",
          source: "acled-heatmap",
          layout: { visibility: heatmapVis as "visible" | "none" },
          paint: {
            "line-color": "rgba(239, 68, 68, 0.15)",
            "line-width": 0.5,
          },
        });

        // Hover popup for oblast info
        mapInstance.on("click", "acled-heatmap-fill", (e) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties || {};
          heatmapPopupRef.current?.remove();
          heatmapPopupRef.current = new maplibregl.Popup({
            closeOnClick: true,
            maxWidth: "220px",
            className: "battle-popup",
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `<div style="font-family: system-ui; color: #e8e8ed; padding: 4px;">
                  <div style="font-weight: 600; font-size: 0.75rem; color: #fca5a5; margin-bottom: 4px;">${props.name}</div>
                  <div style="font-size: 0.625rem; color: #b0b0c0;">
                    <div>${t("map.fatalities")}: <span style="color: #ef4444; font-weight: 600;">${Number(props.fatalities).toLocaleString()}</span></div>
                    <div>${t("map.events")}: <span style="color: #f97316; font-weight: 600;">${Number(props.events).toLocaleString()}</span></div>
                  </div>
                </div>`,
            )
            .addTo(mapInstance);
        });

        mapInstance.on("mouseenter", "acled-heatmap-fill", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "acled-heatmap-fill", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }
    } catch (err) {
      console.error("Failed to load ACLED heatmap:", err);
    }
  }, []);

  // ── Missile / Drone Attack Markers ──────────────────────

  /** Convert a YYYYMMDD string to a day-count for easy ± comparison. */
  const yyyymmddToDays = (d: string): number => {
    const y = Number.parseInt(d.slice(0, 4), 10);
    const m = Number.parseInt(d.slice(4, 6), 10);
    const day = Number.parseInt(d.slice(6, 8), 10);
    return Math.floor(Date.UTC(y, m - 1, day) / 86_400_000);
  };

  // ── Buildup / Mobilization layer ──────────────────────────────────────
  const loadBuildupLayer = useCallback(
    (mapInstance: maplibregl.Map) => {
      ensureBuildupIcon(mapInstance);

      if (!mapInstance.getSource("buildup-source")) {
        mapInstance.addSource("buildup-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        const vis = layersRef.current.buildup ? "visible" : "none";

        // Ambient glow
        mapInstance.addLayer({
          id: "buildup-glow",
          type: "circle",
          source: "buildup-source",
          layout: { visibility: vis },
          paint: {
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "troops"],
              1000,
              12,
              5000,
              18,
              15000,
              26,
              30000,
              34,
              50000,
              42,
            ],
            "circle-color": "#f59e0b",
            "circle-opacity": 0.15,
            "circle-blur": 0.8,
          },
        });

        // Icon marker
        mapInstance.addLayer({
          id: "buildup-points",
          type: "symbol",
          source: "buildup-source",
          layout: {
            visibility: vis,
            "icon-image": "buildup-camp",
            "icon-size": [
              "interpolate",
              ["linear"],
              ["get", "troops"],
              1000,
              0.4,
              5000,
              0.55,
              15000,
              0.7,
              30000,
              0.85,
              50000,
              1.0,
            ],
            "icon-allow-overlap": true,
            "icon-ignore-placement": true,
          },
          paint: {
            "icon-color": "#f59e0b",
            "icon-opacity": 0.85,
          },
        });

        // Click popup
        mapInstance.on("click", "buildup-points", (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties;
          if (!p) return;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

          const equipParts: string[] = [];
          if (Number(p.tanks) > 0) equipParts.push(`Tanks: ~${p.tanks}`);
          if (Number(p.ifvs) > 0) equipParts.push(`IFVs: ~${p.ifvs}`);
          if (Number(p.artillery) > 0) equipParts.push(`Artillery: ~${p.artillery}`);
          if (Number(p.mlrs) > 0) equipParts.push(`MLRS: ~${p.mlrs}`);
          if (Number(p.aircraft) > 0) equipParts.push(`Aircraft: ~${p.aircraft}`);
          if (Number(p.helicopters) > 0) equipParts.push(`Helicopters: ~${p.helicopters}`);
          const equipHtml = equipParts.length
            ? `<div style="font-size:11px;color:#d1d5db;margin-top:6px;line-height:1.5">${equipParts.join("<br>")}</div>`
            : "";

          const unitList = p.units
            ? ((typeof p.units === "string" ? JSON.parse(p.units) : p.units) as string[])
            : [];
          const unitsHtml = unitList.length
            ? `<div style="font-size:10px;color:#9ca3af;margin-top:6px">${unitList.join(", ")}</div>`
            : "";

          buildupPopupRef.current?.remove();
          buildupPopupRef.current = new maplibregl.Popup({
            closeOnClick: true,
            maxWidth: "280px",
            className: "battle-popup",
          })
            .setLngLat(coords)
            .setHTML(
              `<div style="max-width:280px">
                <div style="font-weight:700;font-size:13px;color:#fbbf24;margin-bottom:2px">${p.name}</div>
                <div style="font-size:11px;color:#9ca3af;margin-bottom:4px">${p.role}</div>
                <div style="display:flex;gap:8px;margin-bottom:4px">
                  <span style="font-size:11px;color:#f59e0b"><strong>~${Number(p.troops).toLocaleString()}</strong> troops</span>
                  ${Number(p.btgs) > 0 ? `<span style="font-size:11px;color:#d97706">${p.btgs} BTGs</span>` : ""}
                </div>
                ${equipHtml}
                ${unitsHtml}
                <div style="font-size:10px;color:#6b7280;margin-top:6px">${p.locations}</div>
              </div>`,
            )
            .addTo(mapInstance);
        });

        mapInstance.on("mouseenter", "buildup-points", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "buildup-points", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }

      // Update data based on current timeline date
      const source = mapInstance.getSource("buildup-source") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;

      if (!territoryDate) {
        source.setData({ type: "FeatureCollection", features: [] });
        return;
      }

      const features: GeoJSON.Feature[] = MOBILIZATION_GROUPINGS.filter((g) => {
        const start = Number.parseInt(g.startDate, 10);
        const end = g.endDate ? Number.parseInt(g.endDate, 10) : 99999999;
        const current = Number.parseInt(territoryDate, 10);
        return current >= start && current <= end;
      }).map((g) => ({
        type: "Feature" as const,
        geometry: { type: "Point" as const, coordinates: [g.lng, g.lat] },
        properties: {
          name: g.name,
          role: g.role,
          troops: g.estimatedTroops,
          btgs: g.btgs,
          tanks: g.equipment.tanks,
          ifvs: g.equipment.ifvs,
          artillery: g.equipment.artillery,
          mlrs: g.equipment.mlrs,
          aircraft: g.equipment.aircraft,
          helicopters: g.equipment.helicopters,
          units: JSON.stringify(g.units),
          locations: g.locations.join(", "),
          phase: g.phase,
        },
      }));

      source.setData({ type: "FeatureCollection", features });
    },
    [ensureBuildupIcon, territoryDate],
  );

  const loadAttackMarkers = useCallback(
    (mapInstance: maplibregl.Map) => {
      // Add source + layers once
      if (!mapInstance.getSource("attacks-source")) {
        mapInstance.addSource("attacks-source", {
          type: "geojson",
          data: { type: "FeatureCollection", features: [] },
        });

        const conflictsVis = layersRef.current.conflicts ? "visible" : "none";

        // Outer pulse ring
        mapInstance.addLayer({
          id: "attacks-pulse",
          type: "circle",
          source: "attacks-source",
          layout: { visibility: conflictsVis as "visible" | "none" },
          paint: {
            "circle-radius": ["match", ["get", "type"], "massive", 16, "major", 12, 10],
            "circle-color": "#EF4444",
            "circle-opacity": 0.15,
          },
        });

        // Inner point
        mapInstance.addLayer({
          id: "attacks-points",
          type: "circle",
          source: "attacks-source",
          layout: { visibility: conflictsVis as "visible" | "none" },
          paint: {
            "circle-radius": ["match", ["get", "type"], "massive", 8, "major", 6, 5],
            "circle-color": "#EF4444",
            "circle-opacity": 0.7,
            "circle-stroke-width": 2,
            "circle-stroke-color": "#EF4444",
            "circle-stroke-opacity": 0.3,
          },
        });

        // Click popup
        mapInstance.on("click", "attacks-points", (e) => {
          if (!e.features?.length) return;
          const p = e.features[0].properties;
          if (!p) return;
          const coords = (e.features[0].geometry as GeoJSON.Point).coordinates as [number, number];

          const typeBadge = `<span style="display:inline-block;padding:1px 6px;border-radius:4px;font-size:10px;font-weight:600;text-transform:uppercase;background:${
            p.type === "massive"
              ? "rgba(239,68,68,0.25)"
              : p.type === "major"
                ? "rgba(249,115,22,0.25)"
                : "rgba(234,179,8,0.25)"
          };color:${
            p.type === "massive" ? "#f87171" : p.type === "major" ? "#fb923c" : "#facc15"
          }">${p.type}</span>`;

          const missiles =
            Number(p.missilesLaunched) > 0
              ? `<div style="margin-top:4px">🚀 Missiles: ${p.missilesIntercepted}/${p.missilesLaunched} intercepted</div>`
              : "";
          const drones =
            Number(p.dronesLaunched) > 0
              ? `<div>🛩 Drones: ${p.dronesIntercepted}/${p.dronesLaunched} intercepted</div>`
              : "";

          const targets = p.targets
            ? `<div style="margin-top:4px;color:#9ca3af">Targets: ${typeof p.targets === "string" ? p.targets : JSON.parse(p.targets).join(", ")}</div>`
            : "";

          const casualties = p.casualties
            ? `<div style="color:#ef4444;margin-top:4px">⚠ ${typeof p.casualties === "string" ? p.casualties : p.casualties}</div>`
            : "";

          attackPopupRef.current?.remove();
          attackPopupRef.current = new maplibregl.Popup({
            offset: 10,
            closeButton: true,
            closeOnClick: false,
            className: "acled-popup",
          })
            .setLngLat(coords)
            .setHTML(
              `<div style="font-size:12px;color:#e8e8ed;line-height:1.5;max-width:280px">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                  <strong style="color:#f87171">${formatDateDisplay(p.date)}</strong>
                  ${typeBadge}
                </div>
                <div style="color:#d1d5db">${p.description}</div>
                ${missiles}${drones}${targets}${casualties}
              </div>`,
            )
            .addTo(mapInstance);
        });

        mapInstance.on("mouseenter", "attacks-points", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "attacks-points", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
      }

      // Update data based on current timeline date
      const source = mapInstance.getSource("attacks-source") as
        | maplibregl.GeoJSONSource
        | undefined;
      if (!source) return;

      if (!territoryDate) {
        source.setData({ type: "FeatureCollection", features: [] });
        return;
      }

      const currentDays = yyyymmddToDays(territoryDate);
      const windowDays = 3;

      const features: GeoJSON.Feature[] = [];
      for (const attack of MISSILE_ATTACKS) {
        const attackDays = yyyymmddToDays(attack.date);
        if (Math.abs(attackDays - currentDays) > windowDays) continue;

        const locations = getAttackLocations(attack);
        for (const [lng, lat] of locations) {
          features.push({
            type: "Feature",
            geometry: { type: "Point", coordinates: [lng, lat] },
            properties: {
              date: attack.date,
              type: attack.type,
              description: attack.description,
              missilesLaunched: attack.missiles.launched,
              missilesIntercepted: attack.missiles.intercepted,
              dronesLaunched: attack.drones.launched,
              dronesIntercepted: attack.drones.intercepted,
              targets: JSON.stringify(attack.targets),
              casualties: attack.casualties
                ? `${attack.casualties.killed} killed, ${attack.casualties.injured} injured`
                : "",
            },
          });
        }
      }

      source.setData({ type: "FeatureCollection", features });
    },
    [territoryDate],
  );

  // Store initial-load callbacks in refs so the init effect never re-runs
  const loadTerritoryDataRef = useRef(loadTerritoryData);
  useEffect(() => {
    loadTerritoryDataRef.current = loadTerritoryData;
  }, [loadTerritoryData]);

  const loadEquipmentDataRef = useRef(loadEquipmentData);
  useEffect(() => {
    loadEquipmentDataRef.current = loadEquipmentData;
  }, [loadEquipmentData]);

  // Initialize map (runs once on mount)
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: initialCenter ?? MAP_CENTER,
      zoom: initialZoom ?? MAP_ZOOM,
      minZoom: 4,
      maxZoom: 16,
      attributionControl: false,
      pitchWithRotate: false,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-right");

    // Suppress non-critical MapLibre worker errors (e.g., GeoJSON processing race conditions)
    map.current.on("error", (e) => {
      if (e?.error?.message?.includes("reading 'length'")) return;
    });

    map.current.on("load", async () => {
      setLoaded(true);
      if (map.current) {
        // Pre-load all icons synchronously before any layers reference them
        loadEquipmentIcons(map.current);
        loadConflictIcons(map.current);
        loadInfrastructureIcons(map.current);

        // Border must complete first — heatmap depends on oblastsRef
        await loadUkraineBorder(map.current);
        loadTerritoryDataRef.current(map.current);
        loadEquipmentDataRef.current(map.current);
        loadAcledData(map.current);
        loadAcledHeatmap(map.current);
        if (battles.length > 0) {
          loadBattleMarkers(map.current, battles);
        }
        if (operations.length > 0) {
          loadOperationLayers(map.current, operations);
        }
        loadInfrastructureLayers(map.current);
        loadNATOBelarusLayers(map.current);
        loadMilitaryBaseLayers(map.current);
        loadThermalLayer(map.current, territoryDate || undefined);
        loadAttackMarkers(map.current);
        loadBuildupLayer(map.current);
        ensureAllianceLayers(map.current);

        // Safety net: retry territory load if source is still empty after 3s
        const m = map.current;
        setTimeout(() => {
          if (!m.isStyleLoaded()) return;
          const src = m.getSource("territory") as maplibregl.GeoJSONSource | undefined;
          if (!src) {
            lastTerritoryFetchRef.current = null;
            loadTerritoryDataRef.current(m);
          }
        }, 3000);
      }
    });

    map.current.on("moveend", () => {
      if (!map.current) return;
      const center = map.current.getCenter();
      const zoom = map.current.getZoom();
      onMoveEndRef.current?.([center.lng, center.lat], zoom);
    });

    return () => {
      popupRef.current?.remove();
      acledPopupRef.current?.remove();
      battlePopupRef.current?.remove();
      operationPopupRef.current?.remove();
      infrastructurePopupRef.current?.remove();
      natoPopupRef.current?.remove();
      militaryBasePopupRef.current?.remove();
      thermalPopupRef.current?.remove();
      heatmapPopupRef.current?.remove();
      attackPopupRef.current?.remove();
      lastTerritoryFetchRef.current = null;
      territoryAbortRef.current?.abort();
      setLoaded(false);
      map.current?.remove();
      map.current = null;
    };
    // Only run on mount — all changing callbacks use refs
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Territory fill (occupation overlay)
    if (map.current.getLayer("territory-fill")) {
      map.current.setLayoutProperty(
        "territory-fill",
        "visibility",
        layers.territory ? "visible" : "none",
      );
    }

    // VIINA territory layers
    const viinaLayerIds = ["viina-ru", "viina-contested", "viina-ru-pts", "viina-contested-pts"];
    for (const id of viinaLayerIds) {
      if (map.current?.getLayer(id)) {
        map.current.setLayoutProperty(id, "visibility", layers.territory ? "visible" : "none");
      }
    }

    // Frontline border (separate toggle — applies to both DeepState and VIINA)
    if (map.current.getLayer("territory-line")) {
      map.current.setLayoutProperty(
        "territory-line",
        "visibility",
        layers.frontline ? "visible" : "none",
      );
    }
    if (map.current.getLayer("viina-frontline")) {
      map.current.setLayoutProperty(
        "viina-frontline",
        "visibility",
        layers.frontline ? "visible" : "none",
      );
    }

    const equipmentLayers = ["equipment-clusters", "equipment-cluster-count", "equipment-icons"];

    equipmentLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.equipment ? "visible" : "none");
      }
    });

    const borderLayers = [
      "ukraine-mask-fill",
      "ukraine-inner-glow",
      "ukraine-border-glow",
      "ukraine-border-line",
      "russia-border-glow",
      "russia-border-line",
    ];

    borderLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.border ? "visible" : "none");
      }
    });

    // ACLED conflict event layers
    const acledLayers = ["acled-clusters", "acled-cluster-count", "acled-points"];

    acledLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.conflicts ? "visible" : "none");
      }
    });

    // Attack marker layers (tied to conflicts toggle)
    const attackLayers = ["attacks-points", "attacks-pulse"];
    for (const layer of attackLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.conflicts ? "visible" : "none");
      }
    }

    // ACLED regional heatmap layers
    const heatmapLayers = ["acled-heatmap-fill", "acled-heatmap-line"];
    heatmapLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.heatmap ? "visible" : "none");
      }
    });

    // Battle marker layers
    const battleLayers = ["battle-glow", "battle-points", "battle-labels"];
    battleLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.battles ? "visible" : "none");
      }
    });

    // Operation arrow layers
    const operationLayers = [
      "operation-line-glow",
      "operation-lines",
      "operation-lines-ongoing",
      "operation-lines-retreat",
      "operation-arrowheads",
      "operation-labels",
    ];
    operationLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.operations ? "visible" : "none");
      }
    });

    // Infrastructure layers
    const infraLayers = [
      "infrastructure-nuclear-glow",
      "infrastructure-points",
      "infrastructure-labels",
      "gas-pipeline-lines",
      "gas-pipeline-lines-shutdown",
      "gas-pipeline-labels",
    ];
    for (const layer of infraLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.infrastructure ? "visible" : "none",
        );
      }
    }

    // NATO/Belarus layers
    const natoLayers = ["nato-points", "belarus-points", "nato-belarus-labels"];
    for (const layer of natoLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.nato ? "visible" : "none");
      }
    }

    // Ukraine/Russia military base layers
    const militaryBaseLayers = [
      "ukraine-base-points",
      "russia-base-points",
      "military-base-labels",
    ];
    for (const layer of militaryBaseLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.nato ? "visible" : "none");
      }
    }

    // Thermal anomaly layers
    const thermalLayers = ["thermal-glow", "thermal-points"];
    for (const layer of thermalLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.thermal ? "visible" : "none");
      }
    }

    // Alliance country outline layers
    const allianceLayers = [
      "alliance-ukraine-fill",
      "alliance-ukraine-line",
      "alliance-russia-fill",
      "alliance-russia-line",
    ];
    for (const layer of allianceLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.alliance ? "visible" : "none");
      }
    }

    // Buildup / Mobilization layers
    const buildupLayers = ["buildup-glow", "buildup-points"];
    for (const layer of buildupLayers) {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(layer, "visibility", layers.buildup ? "visible" : "none");
      }
    }
  }, [
    loaded,
    layers.territory,
    layers.frontline,
    layers.equipment,
    layers.border,
    layers.conflicts,
    layers.heatmap,
    layers.battles,
    layers.operations,
    layers.infrastructure,
    layers.nato,
    layers.thermal,
    layers.alliance,
    layers.buildup,
  ]);

  // Update territory when timeline date changes
  // loadTerritoryData handles deduplication (lastTerritoryFetchRef) and abort (territoryAbortRef)
  useEffect(() => {
    if (!map.current || !loaded) return;
    const m = map.current;

    if (m.isStyleLoaded()) {
      loadTerritoryData(m);
    } else {
      const onIdle = () => {
        if (map.current) loadTerritoryData(map.current);
      };
      m.once("idle", onIdle);
      return () => {
        m.off("idle", onIdle);
      };
    }
  }, [loaded, territoryDate, loadTerritoryData]);

  // Update infrastructure status based on timeline date
  // Fetch historical equipment data when timeline moves to a new month
  useEffect(() => {
    if (!loaded || !territoryDate) return;
    const controller = new AbortController();
    const month = `${territoryDate.slice(0, 4)}-${territoryDate.slice(4, 6)}`;

    const fetchMonth = (m: string) => {
      if (m < "2022-02" || fetchedMonthsRef.current.has(m)) return;
      fetchedMonthsRef.current.add(m);

      fetch(`/api/losses/month?month=${m}`, { signal: controller.signal })
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          if (!data?.losses?.length) return;
          const existingIds = new Set(equipmentDataRef.current.map((mk) => mk.id));
          const newMarkers: EquipmentMarker[] = data.losses
            .filter(
              (l: { geo?: string | null; id: number }) =>
                l.geo?.includes(",") && !existingIds.has(l.id),
            )
            .map(
              (l: {
                id: number;
                type: string;
                model: string;
                status: string;
                date: string;
                nearest_location: string | null;
                geo: string;
              }) => {
                const [lat, lng] = l.geo.split(",").map(Number);
                return {
                  id: l.id,
                  type: l.type,
                  model: l.model,
                  status: l.status,
                  date: l.date,
                  location: l.nearest_location,
                  lat,
                  lng,
                };
              },
            )
            .filter(
              (mk: { lat: number; lng: number }) => !Number.isNaN(mk.lat) && !Number.isNaN(mk.lng),
            );

          if (newMarkers.length > 0) {
            equipmentDataRef.current = [...equipmentDataRef.current, ...newMarkers].sort((a, b) =>
              a.date.localeCompare(b.date),
            );
            setEquipmentVersion((v) => v + 1);
          }
        })
        .catch((e) => {
          if (e instanceof Error && e.name === "AbortError") return;
          fetchedMonthsRef.current.delete(m);
        });
    };

    // Fetch current month
    fetchMonth(month);

    // Pre-fetch adjacent months for smoother playback
    const [year, mon] = [parseInt(month.slice(0, 4), 10), parseInt(month.slice(5, 7), 10)];
    const nextMon = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
    const prevMon = mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, "0")}`;
    fetchMonth(nextMon);
    fetchMonth(prevMon);

    return () => controller.abort();
  }, [loaded, territoryDate]);

  // Batch-update all map sources when timeline date changes (single debounced effect)
  const lastMapUpdateRef = useRef<string | null>(null);

  useEffect(() => {
    if (!map.current || !loaded) return;

    const timer = setTimeout(() => {
      const m = map.current;
      if (!m || !m.isStyleLoaded()) return;

      const timelineDateNorm = territoryDate
        ? `${territoryDate.slice(0, 4)}-${territoryDate.slice(4, 6)}-${territoryDate.slice(6, 8)}`
        : null;

      // Skip if the normalised date hasn't actually changed
      if (timelineDateNorm === lastMapUpdateRef.current) return;
      lastMapUpdateRef.current = timelineDateNorm;

      // --- Equipment markers ---
      const eqSource = m.getSource("equipment") as maplibregl.GeoJSONSource | undefined;
      if (eqSource && equipmentDataRef.current.length > 0) {
        const filtered = timelineDateNorm
          ? equipmentDataRef.current.filter((mk) => mk.date <= timelineDateNorm)
          : equipmentDataRef.current;

        eqSource.setData({
          type: "FeatureCollection",
          features: filtered.map((mk) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [mk.lng, mk.lat] },
            properties: {
              id: mk.id,
              type: mk.type,
              model: mk.model,
              status: mk.status,
              date: mk.date,
              location: mk.location || "",
              category: mk.category || "other",
            },
          })),
        });
      }

      // --- ACLED conflict events ---
      const acledSource = m.getSource("acled") as maplibregl.GeoJSONSource | undefined;
      if (acledSource && acledDataRef.current) {
        if (!timelineDateNorm) {
          acledSource.setData(acledDataRef.current);
        } else {
          acledSource.setData({
            type: "FeatureCollection",
            features: acledDataRef.current.features.filter((f) => {
              const date = f.properties?.date;
              return date && date <= timelineDateNorm;
            }),
          });
        }
      }

      // --- Battle markers ---
      if (battles.length > 0) {
        const battleSource = m.getSource("battles") as maplibregl.GeoJSONSource | undefined;
        if (battleSource) {
          battleSource.setData(battleGeoJSON(battles, territoryDate));
        }
      }

      // --- Operation arrows ---
      if (operations.length > 0) {
        const opSource = m.getSource("operations") as maplibregl.GeoJSONSource | undefined;
        if (opSource) {
          opSource.setData(operationsGeoJSON(operations, territoryDate));
        }
        const arrowSource = m.getSource("operation-arrows") as maplibregl.GeoJSONSource | undefined;
        if (arrowSource) {
          arrowSource.setData(operationArrowheadsGeoJSON(operations, territoryDate));
        }
      }

      // --- Attack markers ---
      loadAttackMarkers(m);

      // --- Buildup markers ---
      loadBuildupLayer(m);

      // --- ACLED heatmap ---
      const heatmapSource = m.getSource("acled-heatmap") as maplibregl.GeoJSONSource | undefined;
      if (heatmapSource && acledRegionalRef.current && oblastsRef.current) {
        const data = acledRegionalRef.current;
        const oblastFeatures = oblastsRef.current.features;

        const year = territoryDate ? parseInt(territoryDate.slice(0, 4), 10) : null;
        const month = territoryDate ? parseInt(territoryDate.slice(4, 6), 10) : null;

        // Build lookup map once instead of O(n) .find() per oblast
        const oblastMap = new Map(data.oblasts.map((o) => [o.name, o]));

        const geoWithData: GeoJSON.FeatureCollection = {
          type: "FeatureCollection",
          features: oblastFeatures.map((f) => {
            const name = (f.properties as { name: string }).name;
            const oblastData = oblastMap.get(name);
            let fatalities = 0;
            let events = 0;

            if (oblastData?.monthly) {
              for (const mk of oblastData.monthly) {
                if (year && month) {
                  const mi = monthIndex(mk.month);
                  if (mk.year < year || (mk.year === year && mi <= month)) {
                    fatalities += mk.fatalities;
                    events += mk.events;
                  }
                } else if (mk.year >= 2022) {
                  fatalities += mk.fatalities;
                  events += mk.events;
                }
              }
            }

            return { ...f, properties: { ...f.properties, fatalities, events } };
          }),
        };

        heatmapSource.setData(geoWithData);
      }

      // --- Infrastructure & gas pipelines ---
      const infraSrc = m.getSource("infrastructure") as maplibregl.GeoJSONSource | undefined;
      if (infraSrc) {
        const features = buildInfraFeatures(territoryDate);
        infraSrc.setData({ type: "FeatureCollection", features });
      }
      const pipelineSrc = m.getSource("gas-pipelines") as maplibregl.GeoJSONSource | undefined;
      if (pipelineSrc && gasPipelines.length > 0) {
        const pipeFeatures: GeoJSON.Feature[] = gasPipelines.map((p) => {
          const status = territoryDate ? getStatusAtDate(p, territoryDate) : p.status;
          return {
            type: "Feature",
            geometry: { type: "LineString", coordinates: p.waypoints.map((w) => [w.lng, w.lat]) },
            properties: { id: p.id, name: p.name, status, description: p.description },
          };
        });
        pipelineSrc.setData({ type: "FeatureCollection", features: pipeFeatures });
      }

      // --- Thermal anomalies (FIRMS) ---
      // Thermal data is NOT updated here during rapid date changes.
      // It has its own debounced effect (2s) below to avoid hammering the NASA API.
    }, 150);

    return () => clearTimeout(timer);
  }, [
    loaded,
    territoryDate,
    battles,
    operations,
    loadAttackMarkers,
    loadBuildupLayer,
    buildInfraFeatures,
    gasPipelines,
  ]);

  // ── Thermal layer date update (heavily debounced — 2s) ──
  // Separate from the main date-change effect to avoid flooding NASA FIRMS.
  // Satellite data has ~12h granularity, so rapid updates during playback are noise.
  useEffect(() => {
    if (!loaded || !map.current) return;
    const m = map.current;
    if (!m.getSource("thermal-anomalies") || !layers.thermal) return;

    const timer = setTimeout(() => {
      loadThermalLayer(m, territoryDate || undefined);
    }, 2000);

    return () => clearTimeout(timer);
  }, [loaded, territoryDate, layers.thermal, loadThermalLayer]);

  // Fly to target location
  useEffect(() => {
    if (!map.current || !loaded || !flyToTarget) return;
    map.current.flyTo({
      center: [flyToTarget.lng, flyToTarget.lat],
      zoom: flyToTarget.zoom ?? 9,
      duration: 1500,
      essential: true,
    });
  }, [loaded, flyToTarget]);

  // Active event marker on map
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Remove existing marker
    if (eventMarkerRef.current) {
      eventMarkerRef.current.remove();
      eventMarkerRef.current = null;
    }

    if (!activeEvent) return;

    // Create pulsing marker element
    const el = document.createElement("div");
    el.className = "event-marker-pin";
    el.innerHTML = `
      <div style="
        position: relative;
        width: 28px;
        height: 28px;
      ">
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: oklch(0.85 0.18 85);
          opacity: 0.3;
          animation: event-pulse 2s ease-out infinite;
        "></div>
        <div style="
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: oklch(0.85 0.18 85);
          border: 2px solid oklch(0.15 0 0);
          box-shadow: 0 0 8px oklch(0.85 0.18 85 / 0.6);
        "></div>
      </div>
    `;

    // Inject pulse animation if not already present
    if (!document.getElementById("event-pulse-style")) {
      const style = document.createElement("style");
      style.id = "event-pulse-style";
      style.textContent = `
        @keyframes event-pulse {
          0% { transform: scale(1); opacity: 0.3; }
          100% { transform: scale(3); opacity: 0; }
        }
      `;
      document.head.appendChild(style);
    }

    const popup = new maplibregl.Popup({
      offset: 20,
      closeButton: true,
      closeOnClick: false,
      className: "event-marker-popup",
    }).setHTML(`
      <div style="
        padding: 8px 12px;
        max-width: 240px;
      ">
        <div style="
          font-size: 0.75rem;
          font-weight: 600;
          color: oklch(0.85 0.18 85);
          margin-bottom: 2px;
        ">${activeEvent.label}</div>
        <div style="
          font-size: 0.625rem;
          color: oklch(0.65 0 0);
          line-height: 1.4;
        ">${activeEvent.description}</div>
      </div>
    `);

    const marker = new maplibregl.Marker({ element: el, anchor: "center" })
      .setLngLat([activeEvent.lng, activeEvent.lat])
      .setPopup(popup)
      .addTo(map.current);

    marker.togglePopup();
    eventMarkerRef.current = marker;

    return () => {
      if (eventMarkerRef.current) {
        eventMarkerRef.current.remove();
        eventMarkerRef.current = null;
      }
    };
  }, [loaded, activeEvent]);

  return (
    <>
      <div
        ref={mapContainer}
        className="fixed inset-0 z-0"
        style={{ width: "100%", height: "100%" }}
      />
      {!loaded && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-ua-blue border-t-transparent" />
            <span className="text-sm text-muted-foreground">{t("map.loading")}</span>
          </div>
        </div>
      )}
    </>
  );
}
