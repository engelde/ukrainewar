"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CENTER, MAP_ZOOM, MAP_STYLE } from "@/lib/constants";
import type { MapLayers, EquipmentMarker } from "@/lib/types";
import type { Battle } from "@/data/battles";
import ukraineBorder from "@/data/ukraine-border.json";
import ukraineMask from "@/data/ukraine-mask.json";
import ukraineOblasts from "@/data/ukraine-oblasts.json";

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

const STATUS_COLORS: Record<string, string> = {
  destroyed: "#e53e3e",
  damaged: "#ed8936",
  captured: "#48bb78",
  abandoned: "#9f7aea",
};

function normalizeEquipmentCategory(type: string): string {
  const t = type.toLowerCase();
  if (t.includes("tank")) return "tank";
  if (t.includes("ifv") || t.includes("apc") || t.includes("mrap") || t.includes("imv")) return "ifv";
  if (t.includes("artillery") || t.includes("howitzer") || t.includes("mortar")) return "artillery";
  if (t.includes("mlrs") || t.includes("rocket")) return "mlrs";
  if (t.includes("uav") || t.includes("drone") || t.includes("uas")) return "uav";
  if (t.includes("air defense") || t.includes("anti-air") || t.includes("sam")) return "aa";
  if (t.includes("jet") || t.includes("aircraft") || t.includes("fighter") || t.includes("bomber")) return "jet";
  if (t.includes("helicopter") || t.includes("heli")) return "heli";
  if (t.includes("ship") || t.includes("boat") || t.includes("vessel")) return "ship";
  if (t.includes("truck") || t.includes("vehicle") || t.includes("car") || t.includes("engineering") || t.includes("logistics")) return "vehicle";
  return "other";
}

const CATEGORY_SYMBOLS: Record<string, string> = {
  tank: "T",
  ifv: "I",
  artillery: "A",
  mlrs: "R",
  uav: "D",
  aa: "S",
  jet: "J",
  heli: "H",
  ship: "N",
  vehicle: "V",
  other: "•",
};

function createEquipmentIcon(
  symbol: string,
  statusColor: string,
  size: number
): { width: number; height: number; data: Uint8ClampedArray } {
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  // Outer dark border
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fill();

  // Inner colored circle
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2);
  ctx.fillStyle = statusColor;
  ctx.fill();

  // Category letter
  ctx.fillStyle = "#fff";
  ctx.font = `bold ${Math.round(size * 0.42)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(symbol, size / 2, size / 2 + 1);

  const imgData = ctx.getImageData(0, 0, size, size);
  return { width: size, height: size, data: imgData.data };
}

function loadEquipmentIcons(mapInstance: maplibregl.Map) {
  const statuses = Object.entries(STATUS_COLORS);
  const categories = Object.entries(CATEGORY_SYMBOLS);
  for (const [status, color] of statuses) {
    for (const [cat, symbol] of categories) {
      const id = `equip-${cat}-${status}`;
      if (!mapInstance.hasImage(id)) {
        mapInstance.addImage(id, createEquipmentIcon(symbol, color, 24));
      }
    }
  }
}

function battleGeoJSON(battles: Battle[], timelineDate?: string | null): GeoJSON.FeatureCollection {
  const filtered = timelineDate
    ? battles.filter((b) => b.startDate <= timelineDate)
    : battles;

  return {
    type: "FeatureCollection",
    features: filtered.map((b) => ({
      type: "Feature" as const,
      geometry: {
        type: "Point" as const,
        coordinates: [b.lng, b.lat],
      },
      properties: {
        id: b.id,
        name: b.name,
        significance: b.significance,
        active: timelineDate
          ? b.startDate <= timelineDate && (!b.endDate || b.endDate >= timelineDate)
          : false,
        description: b.description,
        outcome: b.outcome || "",
        dateRange: formatBattleDateRange(b.startDate, b.endDate),
      },
    })),
  };
}

function formatBattleDateRange(start: string, end?: string): string {
  const fmt = (d: string) => {
    const months = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${months[parseInt(d.slice(4, 6))]} ${d.slice(6, 8)}, ${d.slice(0, 4)}`;
  };
  if (!end) return `${fmt(start)} – Present`;
  return `${fmt(start)} – ${fmt(end)}`;
}

const MONTH_NAMES: Record<string, number> = {
  January: 1, February: 2, March: 3, April: 4, May: 5, June: 6,
  July: 7, August: 8, September: 9, October: 10, November: 11, December: 12,
};

function monthIndex(name: string): number {
  return MONTH_NAMES[name] ?? 0;
}

const ACLED_EVENT_COLORS: Record<string, string> = {
  Battles: "#ef4444",
  "Explosions/Remote violence": "#f97316",
  "Violence against civilians": "#a855f7",
  "Strategic developments": "#3b82f6",
  Protests: "#22c55e",
  Riots: "#eab308",
};

function findFirstSymbolLayer(mapInstance: maplibregl.Map): string | undefined {
  const layers = mapInstance.getStyle().layers;
  if (!layers) return undefined;
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}

// VIINA covers Feb 2022 – July 2024; DeepState covers July 2024+
const DEEPSTATE_START = "20240708";

interface MapViewProps {
  layers: MapLayers;
  onMarkerClick?: (marker: EquipmentMarker) => void;
  onMoveEnd?: (center: [number, number], zoom: number) => void;
  territoryDate?: string | null;
  battles?: Battle[];
  flyTo?: { lat: number; lng: number; zoom?: number } | null;
  initialCenter?: [number, number];
  initialZoom?: number;
  activeEvent?: { label: string; description: string; lat: number; lng: number } | null;
}

export default function MapView({
  layers,
  onMarkerClick,
  onMoveEnd,
  territoryDate,
  battles = [],
  flyTo: flyToTarget,
  initialCenter,
  initialZoom,
  activeEvent,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const equipmentDataRef = useRef<EquipmentMarker[]>([]);
  const [equipmentVersion, setEquipmentVersion] = useState(0);
  const fetchedMonthsRef = useRef<Set<string>>(new Set());
  const acledDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const acledPopupRef = useRef<maplibregl.Popup | null>(null);
  const battlePopupRef = useRef<maplibregl.Popup | null>(null);
  const heatmapPopupRef = useRef<maplibregl.Popup | null>(null);
  const eventMarkerRef = useRef<maplibregl.Marker | null>(null);
  const onMoveEndRef = useRef(onMoveEnd);
  useEffect(() => { onMoveEndRef.current = onMoveEnd; }, [onMoveEnd]);
  const acledRegionalRef = useRef<AcledRegionalData | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);

  const loadUkraineBorder = useCallback((mapInstance: maplibregl.Map) => {
    if (mapInstance.getSource("ukraine-border")) return;

    const beforeLayer = findFirstSymbolLayer(mapInstance);

    // Dim mask — darkens everything outside Ukraine
    mapInstance.addSource("ukraine-mask", {
      type: "geojson",
      data: ukraineMask as GeoJSON.FeatureCollection,
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

    // Ukraine border source
    mapInstance.addSource("ukraine-border", {
      type: "geojson",
      data: ukraineBorder as GeoJSON.FeatureCollection,
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
      beforeLayer
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
      beforeLayer
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
          "line-opacity": 0.85,
        },
      },
      beforeLayer
    );
  }, []);

  const ensureViinaLayers = useCallback((mapInstance: maplibregl.Map) => {
    if (mapInstance.getSource("viina-territory")) return;

    mapInstance.addSource("viina-territory", {
      type: "geojson",
      data: { type: "FeatureCollection", features: [] },
    });

    // RU-controlled circles
    mapInstance.addLayer({
      id: "viina-ru",
      type: "circle",
      source: "viina-territory",
      filter: ["==", ["get", "status"], "RU"],
      paint: {
        "circle-color": "#c53030",
        "circle-opacity": 0.45,
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          4, 1.5,
          6, 3,
          8, 6,
          10, 12,
          12, 24,
        ],
        "circle-blur": 0.3,
      },
    });

    // Contested circles
    mapInstance.addLayer({
      id: "viina-contested",
      type: "circle",
      source: "viina-territory",
      filter: ["==", ["get", "status"], "CONTESTED"],
      paint: {
        "circle-color": "#eab308",
        "circle-opacity": 0.5,
        "circle-radius": [
          "interpolate", ["linear"], ["zoom"],
          4, 2,
          6, 4,
          8, 8,
          10, 14,
          12, 28,
        ],
        "circle-blur": 0.2,
      },
    });
  }, []);

  const loadTerritoryData = useCallback(
    async (mapInstance: maplibregl.Map) => {
      try {
        const useViina = territoryDate && territoryDate < DEEPSTATE_START;

        if (useViina) {
          // Use VIINA point-based territory data
          const res = await fetch(`/api/territory/viina?date=${territoryDate}`);

          // Clear DeepState data when using VIINA
          const deepstateSource = mapInstance.getSource(
            "territory"
          ) as maplibregl.GeoJSONSource | undefined;
          if (deepstateSource) {
            deepstateSource.setData({ type: "FeatureCollection", features: [] });
          }

          ensureViinaLayers(mapInstance);
          const viinaSource = mapInstance.getSource(
            "viina-territory"
          ) as maplibregl.GeoJSONSource | undefined;

          if (!res.ok || !viinaSource) return;
          const { geojson } = await res.json();
          viinaSource.setData(geojson);

          // Show VIINA layers, hide territory layers
          ["viina-ru", "viina-contested"].forEach((id) => {
            if (mapInstance.getLayer(id))
              mapInstance.setLayoutProperty(id, "visibility", "visible");
          });
          return;
        }

        // Clear VIINA data when using DeepState
        const viinaSource = mapInstance.getSource(
          "viina-territory"
        ) as maplibregl.GeoJSONSource | undefined;
        if (viinaSource) {
          viinaSource.setData({ type: "FeatureCollection", features: [] });
        }

        // DeepState territory (July 2024+)
        const url = territoryDate
          ? `/api/territory/${territoryDate}`
          : "/api/territory";
        const res = await fetch(url);

        const existingSource = mapInstance.getSource(
          "territory"
        ) as maplibregl.GeoJSONSource | undefined;

        if (!res.ok) {
          if (existingSource) {
            existingSource.setData({ type: "FeatureCollection", features: [] });
          }
          return;
        }
        const { geojson } = await res.json();

        if (existingSource) {
          existingSource.setData(geojson);
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
        console.error("Failed to load territory data:", err);
      }
    },
    [territoryDate, ensureViinaLayers]
  );

  const loadEquipmentData = useCallback(
    async (mapInstance: maplibregl.Map) => {
      try {
        const res = await fetch("/api/losses/recent");
        if (!res.ok) return;
        const data = await res.json();

        // Parse geo-tagged losses into markers
        const markers: EquipmentMarker[] = (data.losses || [])
          .filter(
            (l: { geo?: string | null }) => l.geo && l.geo.includes(",")
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
            }
          )
          .filter(
            (m: { lat: number; lng: number }) =>
              !isNaN(m.lat) && !isNaN(m.lng)
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
              category: normalizeEquipmentCategory(m.type),
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
            "circle-radius": [
              "step",
              ["get", "point_count"],
              16,
              5,
              22,
              15,
              28,
            ],
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

        // Individual markers (unclustered) — circles at low zoom
        mapInstance.addLayer({
          id: "equipment-points",
          type: "circle",
          source: "equipment",
          filter: ["!", ["has", "point_count"]],
          maxzoom: 14,
          paint: {
            "circle-color": [
              "match",
              ["get", "status"],
              "destroyed",
              STATUS_COLORS.destroyed,
              "damaged",
              STATUS_COLORS.damaged,
              "captured",
              STATUS_COLORS.captured,
              "abandoned",
              STATUS_COLORS.abandoned,
              "#888",
            ],
            "circle-radius": 6,
            "circle-stroke-width": 2,
            "circle-stroke-color": "rgba(0,0,0,0.5)",
          },
        });

        // Individual markers — category icons at high zoom
        loadEquipmentIcons(mapInstance);

        mapInstance.addLayer({
          id: "equipment-icons",
          type: "symbol",
          source: "equipment",
          filter: ["!", ["has", "point_count"]],
          minzoom: 14,
          layout: {
            "icon-image": [
              "concat",
              "equip-",
              ["get", "category"],
              "-",
              ["get", "status"],
            ] as unknown as maplibregl.ExpressionSpecification,
            "icon-size": 1,
            "icon-allow-overlap": true,
            "icon-ignore-placement": false,
            "icon-padding": 2,
          },
        });

        // Click individual markers
        mapInstance.on("click", "equipment-points", (e) => {
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

        // Click icon markers (high zoom)
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
          const source = mapInstance.getSource(
            "equipment"
          ) as maplibregl.GeoJSONSource;
          try {
            const zoom = await source.getClusterExpansionZoom(clusterId);
            mapInstance.easeTo({
              center: (features[0].geometry as GeoJSON.Point)
                .coordinates as [number, number],
              zoom,
            });
          } catch {
            // ignore cluster zoom errors
          }
        });

        // Cursor changes
        mapInstance.on("mouseenter", "equipment-points", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "equipment-points", () => {
          mapInstance.getCanvas().style.cursor = "";
        });
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
        const showEquipmentTooltip = (e: maplibregl.MapMouseEvent & { features?: maplibregl.MapGeoJSONFeature[] }) => {
          if (!e.features?.length) return;
          const props = e.features[0].properties;
          if (!props) return;
          const coords = (e.features[0].geometry as GeoJSON.Point)
            .coordinates as [number, number];

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
                <span style="color:#8888a0"> · ${props.date}</span>
              </div>`
            )
            .addTo(mapInstance);
        };

        const hideEquipmentTooltip = () => {
          popupRef.current?.remove();
          popupRef.current = null;
        };

        mapInstance.on("mouseenter", "equipment-points", showEquipmentTooltip);
        mapInstance.on("mouseleave", "equipment-points", hideEquipmentTooltip);
        mapInstance.on("mouseenter", "equipment-icons", showEquipmentTooltip);
        mapInstance.on("mouseleave", "equipment-icons", hideEquipmentTooltip);

      } catch (err) {
        console.error("Failed to load equipment data:", err);
      }
    },
    [onMarkerClick]
  );

  // Load ACLED conflict event data
  const loadAcledData = useCallback(
    async (mapInstance: maplibregl.Map) => {
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

        // Cluster circles — warm purple tint
        mapInstance.addLayer({
          id: "acled-clusters",
          type: "circle",
          source: "acled",
          filter: ["has", "point_count"],
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
            "circle-radius": [
              "step",
              ["get", "point_count"],
              14,
              20,
              20,
              100,
              26,
            ],
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
            "text-field": "{point_count_abbreviated}",
            "text-size": 10,
            "text-font": ["Open Sans Bold"],
          },
          paint: {
            "text-color": "#ffffff",
          },
        });

        // Individual event points — color by event type
        mapInstance.addLayer({
          id: "acled-points",
          type: "circle",
          source: "acled",
          filter: ["!", ["has", "point_count"]],
          paint: {
            "circle-color": [
              "match",
              ["get", "type"],
              "Battles",
              ACLED_EVENT_COLORS["Battles"],
              "Explosions/Remote violence",
              ACLED_EVENT_COLORS["Explosions/Remote violence"],
              "Violence against civilians",
              ACLED_EVENT_COLORS["Violence against civilians"],
              "Strategic developments",
              ACLED_EVENT_COLORS["Strategic developments"],
              "Protests",
              ACLED_EVENT_COLORS["Protests"],
              "Riots",
              ACLED_EVENT_COLORS["Riots"],
              "#888",
            ],
            "circle-radius": [
              "interpolate",
              ["linear"],
              ["get", "fatalities"],
              0, 4,
              5, 6,
              20, 9,
              100, 13,
            ],
            "circle-stroke-width": 1.5,
            "circle-stroke-color": "rgba(0,0,0,0.5)",
            "circle-opacity": 0.85,
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
          const fatalities = parseInt(props.fatalities) || 0;

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
                <span style="color:#8888a0">${props.location} · ${props.date}</span>
                ${fatalities > 0 ? `<br/><span style="color:#ef4444">⚔ ${fatalities} fatalities</span>` : ""}
              </div>`
            )
            .addTo(mapInstance);
        });

        mapInstance.on("mouseleave", "acled-points", () => {
          mapInstance.getCanvas().style.cursor = "";
          acledPopupRef.current?.remove();
          acledPopupRef.current = null;
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
    },
    []
  );

  // Load battle markers as a map layer
  const loadBattleMarkers = useCallback(
    (mapInstance: maplibregl.Map, battleData: Battle[]) => {
      if (mapInstance.getSource("battles")) {
        const src = mapInstance.getSource("battles") as maplibregl.GeoJSONSource;
        src.setData(battleGeoJSON(battleData));
        return;
      }

      mapInstance.addSource("battles", {
        type: "geojson",
        data: battleGeoJSON(battleData),
      });

      // Outer glow ring
      mapInstance.addLayer({
        id: "battle-glow",
        type: "circle",
        source: "battles",
        paint: {
          "circle-radius": [
            "match",
            ["get", "significance"],
            "critical", 16,
            "major", 12,
            8,
          ],
          "circle-color": [
            "case",
            ["get", "active"],
            "#ef4444",
            "rgba(239, 68, 68, 0.3)",
          ],
          "circle-opacity": ["case", ["get", "active"], 0.3, 0.15],
          "circle-blur": 0.8,
        },
      });

      // Inner point
      mapInstance.addLayer({
        id: "battle-points",
        type: "circle",
        source: "battles",
        paint: {
          "circle-radius": [
            "match",
            ["get", "significance"],
            "critical", 6,
            "major", 5,
            4,
          ],
          "circle-color": [
            "case",
            ["get", "active"],
            "#ef4444",
            "#b91c1c",
          ],
          "circle-opacity": ["case", ["get", "active"], 0.9, 0.5],
          "circle-stroke-width": 1.5,
          "circle-stroke-color": [
            "case",
            ["get", "active"],
            "#fca5a5",
            "#7f1d1d",
          ],
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
          "text-color": [
            "case",
            ["get", "active"],
            "#fca5a5",
            "#9ca3af",
          ],
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
              <div style="font-weight:700;font-size:13px;color:#fbbf24;margin-bottom:4px">${props.name}</div>
              <div style="font-size:11px;color:#9ca3af;margin-bottom:6px">${props.dateRange}</div>
              <div style="font-size:11px;color:#d1d5db;margin-bottom:6px;line-height:1.4">${props.description}</div>
              ${props.outcome ? `<div style="font-size:11px;color:#60a5fa;margin-bottom:4px"><strong>Outcome:</strong> ${props.outcome}</div>` : ''}
              <div style="font-size:10px;color:#6b7280;text-transform:uppercase;letter-spacing:0.05em">${props.significance}</div>
            </div>`
          )
          .addTo(mapInstance);
      });

      mapInstance.on("mouseenter", "battle-points", () => {
        mapInstance.getCanvas().style.cursor = "pointer";
      });
      mapInstance.on("mouseleave", "battle-points", () => {
        mapInstance.getCanvas().style.cursor = "";
      });
    },
    []
  );

  // Load ACLED regional heatmap (choropleth by oblast)
  const loadAcledHeatmap = useCallback(
    async (mapInstance: maplibregl.Map) => {
      try {
        const res = await fetch("/api/acled/regional");
        if (!res.ok) return;
        const data: AcledRegionalData = await res.json();
        acledRegionalRef.current = data;

        // Guard: map may have been removed during await (React Strict Mode)
        if (map.current !== mapInstance) return;

        const beforeLayer = findFirstSymbolLayer(mapInstance);

        // Create oblast boundaries with event data
        const oblastFeatures = (ukraineOblasts as GeoJSON.FeatureCollection).features;
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
            data: structuredClone(geoWithData),
          });

          mapInstance.addLayer(
            {
              id: "acled-heatmap-fill",
              type: "fill",
              source: "acled-heatmap",
              paint: {
                "fill-color": [
                  "interpolate",
                  ["linear"],
                  ["get", "fatalities"],
                  0, "rgba(0, 0, 0, 0)",
                  100, "rgba(239, 68, 68, 0.08)",
                  1000, "rgba(239, 68, 68, 0.15)",
                  5000, "rgba(239, 68, 68, 0.25)",
                  20000, "rgba(239, 68, 68, 0.4)",
                  50000, "rgba(239, 68, 68, 0.55)",
                ],
                "fill-opacity": 0.7,
              },
            },
            beforeLayer
          );

          mapInstance.addLayer({
            id: "acled-heatmap-line",
            type: "line",
            source: "acled-heatmap",
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
                  <div style="font-weight: 600; font-size: 12px; color: #fca5a5; margin-bottom: 4px;">${props.name}</div>
                  <div style="font-size: 10px; color: #b0b0c0;">
                    <div>Fatalities: <span style="color: #ef4444; font-weight: 600;">${Number(props.fatalities).toLocaleString()}</span></div>
                    <div>Events: <span style="color: #f97316; font-weight: 600;">${Number(props.events).toLocaleString()}</span></div>
                  </div>
                </div>`
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
    },
    []
  );

  // Initialize map
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
      "bottom-right"
    );

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-right"
    );

    // Suppress non-critical MapLibre worker errors (e.g., GeoJSON processing race conditions)
    map.current.on("error", (e) => {
      if (e?.error?.message?.includes("reading 'length'")) return;
    });

    map.current.on("load", () => {
      setLoaded(true);
      if (map.current) {
        loadUkraineBorder(map.current);
        loadTerritoryData(map.current);
        loadEquipmentData(map.current);
        loadAcledData(map.current);
        loadAcledHeatmap(map.current);
        if (battles.length > 0) {
          loadBattleMarkers(map.current, battles);
        }
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
      heatmapPopupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !loaded) return;

    // Territory fill (occupation overlay)
    if (map.current.getLayer("territory-fill")) {
      map.current.setLayoutProperty(
        "territory-fill",
        "visibility",
        layers.territory ? "visible" : "none"
      );
    }

    // VIINA territory layers
    ["viina-ru", "viina-contested"].forEach((id) => {
      if (map.current?.getLayer(id)) {
        map.current.setLayoutProperty(
          id,
          "visibility",
          layers.territory ? "visible" : "none"
        );
      }
    });

    // Frontline border (separate toggle)
    if (map.current.getLayer("territory-line")) {
      map.current.setLayoutProperty(
        "territory-line",
        "visibility",
        layers.frontline ? "visible" : "none"
      );
    }

    const equipmentLayers = [
      "equipment-clusters",
      "equipment-cluster-count",
      "equipment-points",
      "equipment-icons",
    ];

    equipmentLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.equipment ? "visible" : "none"
        );
      }
    });

    const borderLayers = [
      "ukraine-mask-fill",
      "ukraine-inner-glow",
      "ukraine-border-glow",
      "ukraine-border-line",
    ];

    borderLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.border ? "visible" : "none"
        );
      }
    });

    // ACLED conflict event layers
    const acledLayers = [
      "acled-clusters",
      "acled-cluster-count",
      "acled-points",
    ];

    acledLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.conflicts ? "visible" : "none"
        );
      }
    });

    // ACLED regional heatmap layers
    const heatmapLayers = ["acled-heatmap-fill", "acled-heatmap-line"];
    heatmapLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.heatmap ? "visible" : "none"
        );
      }
    });

    // Battle marker layers
    const battleLayers = ["battle-glow", "battle-points", "battle-labels"];
    battleLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.battles ? "visible" : "none"
        );
      }
    });
  }, [loaded, layers.territory, layers.frontline, layers.equipment, layers.border, layers.conflicts, layers.heatmap, layers.battles]);

  // Update territory when timeline date changes (debounced)
  useEffect(() => {
    if (!map.current || !loaded || !territoryDate) return;
    const timer = setTimeout(() => {
      if (map.current) loadTerritoryData(map.current);
    }, 80);
    return () => clearTimeout(timer);
  }, [loaded, territoryDate, loadTerritoryData]);

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
                l.geo && l.geo.includes(",") && !existingIds.has(l.id)
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
              }
            )
            .filter(
              (mk: { lat: number; lng: number }) =>
                !isNaN(mk.lat) && !isNaN(mk.lng)
            );

          if (newMarkers.length > 0) {
            equipmentDataRef.current = [
              ...equipmentDataRef.current,
              ...newMarkers,
            ].sort((a, b) => a.date.localeCompare(b.date));
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
    const [year, mon] = [parseInt(month.slice(0, 4)), parseInt(month.slice(5, 7))];
    const nextMon = mon === 12 ? `${year + 1}-01` : `${year}-${String(mon + 1).padStart(2, "0")}`;
    const prevMon = mon === 1 ? `${year - 1}-12` : `${year}-${String(mon - 1).padStart(2, "0")}`;
    fetchMonth(nextMon);
    fetchMonth(prevMon);

    return () => controller.abort();
  }, [loaded, territoryDate]);

  // Filter equipment markers by timeline date (debounced)
  useEffect(() => {
    if (!map.current || !loaded) return;

    const timer = setTimeout(() => {
      const source = map.current?.getSource("equipment") as maplibregl.GeoJSONSource | undefined;
      if (!source || equipmentDataRef.current.length === 0) return;

      const timelineDateNorm = territoryDate
        ? `${territoryDate.slice(0, 4)}-${territoryDate.slice(4, 6)}-${territoryDate.slice(6, 8)}`
        : null;

      const filtered = timelineDateNorm
        ? equipmentDataRef.current.filter((m) => m.date <= timelineDateNorm)
        : equipmentDataRef.current;

      const geojson: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: filtered.map((m) => ({
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
            category: normalizeEquipmentCategory(m.type),
          },
        })),
      };

      source.setData(geojson);
    }, 80);

    return () => clearTimeout(timer);
  }, [loaded, territoryDate, equipmentVersion]);

  // Filter ACLED conflict events by timeline date (debounced)
  useEffect(() => {
    if (!map.current || !loaded) return;

    const timer = setTimeout(() => {
      const source = map.current?.getSource("acled") as maplibregl.GeoJSONSource | undefined;
      if (!source || !acledDataRef.current) return;

      const timelineDateNorm = territoryDate
        ? `${territoryDate.slice(0, 4)}-${territoryDate.slice(4, 6)}-${territoryDate.slice(6, 8)}`
        : null;

      if (!timelineDateNorm) {
        source.setData(acledDataRef.current);
        return;
      }

      const filtered: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: acledDataRef.current.features.filter((f) => {
          const date = f.properties?.date;
          return date && date <= timelineDateNorm;
        }),
      };

      source.setData(filtered);
    }, 80);

    return () => clearTimeout(timer);
  }, [loaded, territoryDate]);

  // Update battle markers based on timeline date (debounced)
  useEffect(() => {
    if (!map.current || !loaded || battles.length === 0) return;
    const timer = setTimeout(() => {
      const source = map.current?.getSource("battles") as maplibregl.GeoJSONSource | undefined;
      if (!source) return;
      source.setData(battleGeoJSON(battles, territoryDate));
    }, 80);
    return () => clearTimeout(timer);
  }, [loaded, territoryDate, battles]);

  // Update ACLED heatmap by timeline date (debounced)
  useEffect(() => {
    if (!map.current || !loaded) return;

    const timer = setTimeout(() => {
      const source = map.current?.getSource("acled-heatmap") as maplibregl.GeoJSONSource | undefined;
      if (!source || !acledRegionalRef.current) return;

      const data = acledRegionalRef.current;
      const oblastFeatures = (ukraineOblasts as GeoJSON.FeatureCollection).features;

      const year = territoryDate ? parseInt(territoryDate.slice(0, 4)) : null;
      const month = territoryDate ? parseInt(territoryDate.slice(4, 6)) : null;

      const geoWithData: GeoJSON.FeatureCollection = {
        type: "FeatureCollection",
        features: oblastFeatures.map((f) => {
          const name = (f.properties as { name: string }).name;
          const oblastData = data.oblasts.find((o) => o.name === name);
          let fatalities = 0;
          let events = 0;

          if (oblastData?.monthly) {
            if (year && month) {
              oblastData.monthly
                .filter((m) => m.year < year || (m.year === year && monthIndex(m.month) <= month))
                .forEach((m) => {
                  fatalities += m.fatalities;
                  events += m.events;
                });
            } else {
              fatalities = oblastData.monthly
                .filter((m) => m.year >= 2022)
                .reduce((sum, m) => sum + m.fatalities, 0);
              events = oblastData.monthly
                .filter((m) => m.year >= 2022)
                .reduce((sum, m) => sum + m.events, 0);
            }
          }

          return {
            ...f,
            properties: { ...f.properties, fatalities, events },
          };
        }),
      };

      source.setData(structuredClone(geoWithData));
    }, 80);

    return () => clearTimeout(timer);
  }, [loaded, territoryDate]);

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
      closeButton: false,
      closeOnClick: false,
      className: "event-marker-popup",
    }).setHTML(`
      <div style="
        background: oklch(0.15 0 0 / 0.95);
        backdrop-filter: blur(12px);
        border: 1px solid oklch(0.3 0 0);
        border-radius: 8px;
        padding: 8px 12px;
        max-width: 240px;
      ">
        <div style="
          font-size: 12px;
          font-weight: 600;
          color: oklch(0.85 0.18 85);
          margin-bottom: 2px;
        ">${activeEvent.label}</div>
        <div style="
          font-size: 10px;
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
            <span className="text-sm text-muted-foreground">
              Loading map...
            </span>
          </div>
        </div>
      )}
    </>
  );
}
