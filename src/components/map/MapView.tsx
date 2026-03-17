"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { MAP_CENTER, MAP_ZOOM, MAP_STYLE } from "@/lib/constants";
import type { MapLayers, EquipmentMarker } from "@/lib/types";
import ukraineBorder from "@/data/ukraine-border.json";
import ukraineMask from "@/data/ukraine-mask.json";

const STATUS_COLORS: Record<string, string> = {
  destroyed: "#e53e3e",
  damaged: "#ed8936",
  captured: "#48bb78",
  abandoned: "#9f7aea",
};

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

interface MapViewProps {
  layers: MapLayers;
  onMarkerClick?: (marker: EquipmentMarker) => void;
  territoryDate?: string | null;
}

export default function MapView({
  layers,
  onMarkerClick,
  territoryDate,
}: MapViewProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [loaded, setLoaded] = useState(false);
  const equipmentDataRef = useRef<EquipmentMarker[]>([]);
  const acledDataRef = useRef<GeoJSON.FeatureCollection | null>(null);
  const acledPopupRef = useRef<maplibregl.Popup | null>(null);
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

  const loadTerritoryData = useCallback(
    async (mapInstance: maplibregl.Map) => {
      try {
        const url = territoryDate
          ? `/api/territory/${territoryDate}`
          : "/api/territory";
        const res = await fetch(url);

        const existingSource = mapInstance.getSource(
          "territory"
        ) as maplibregl.GeoJSONSource | undefined;

        if (!res.ok) {
          // Clear territory data when out of range (e.g., pre-July 2024)
          if (existingSource) {
            existingSource.setData({ type: "FeatureCollection", features: [] });
          }
          return;
        }
        const { geojson } = await res.json();

        if (existingSource) {
          // Update existing source data (for timeline scrubbing)
          existingSource.setData(geojson);
          return;
        }

        // Guard: double-check source wasn't added between fetch and now
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
    [territoryDate]
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

        // Individual markers (unclustered)
        mapInstance.addLayer({
          id: "equipment-points",
          type: "circle",
          source: "equipment",
          filter: ["!", ["has", "point_count"]],
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
        mapInstance.on("mouseenter", "equipment-clusters", () => {
          mapInstance.getCanvas().style.cursor = "pointer";
        });
        mapInstance.on("mouseleave", "equipment-clusters", () => {
          mapInstance.getCanvas().style.cursor = "";
        });

        // Hover tooltips for individual points
        mapInstance.on("mouseenter", "equipment-points", (e) => {
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
        });

        mapInstance.on("mouseleave", "equipment-points", () => {
          popupRef.current?.remove();
          popupRef.current = null;
        });

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

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: MAP_STYLE,
      center: MAP_CENTER,
      zoom: MAP_ZOOM,
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

    map.current.on("load", () => {
      setLoaded(true);
      if (map.current) {
        loadUkraineBorder(map.current);
        loadTerritoryData(map.current);
        loadEquipmentData(map.current);
        loadAcledData(map.current);
      }
    });

    return () => {
      popupRef.current?.remove();
      acledPopupRef.current?.remove();
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
  }, [loaded, layers.territory, layers.frontline, layers.equipment, layers.border, layers.conflicts]);

  // Update territory when timeline date changes
  useEffect(() => {
    if (!map.current || !loaded || !territoryDate) return;
    loadTerritoryData(map.current);
  }, [loaded, territoryDate, loadTerritoryData]);

  // Filter equipment markers by timeline date
  useEffect(() => {
    if (!map.current || !loaded) return;
    const source = map.current.getSource("equipment") as maplibregl.GeoJSONSource | undefined;
    if (!source || equipmentDataRef.current.length === 0) return;

    // Normalize timeline date (YYYYMMDD) to comparable format
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
        },
      })),
    };

    source.setData(geojson);
  }, [loaded, territoryDate]);

  // Filter ACLED conflict events by timeline date
  useEffect(() => {
    if (!map.current || !loaded) return;
    const source = map.current.getSource("acled") as maplibregl.GeoJSONSource | undefined;
    if (!source || !acledDataRef.current) return;

    // Normalize timeline date (YYYYMMDD) to YYYY-MM-DD for comparison
    const timelineDateNorm = territoryDate
      ? `${territoryDate.slice(0, 4)}-${territoryDate.slice(4, 6)}-${territoryDate.slice(6, 8)}`
      : null;

    if (!timelineDateNorm) {
      // No date filter — show all events
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
  }, [loaded, territoryDate]);

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
