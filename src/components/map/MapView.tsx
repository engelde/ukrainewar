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
        if (!res.ok) return;
        const { geojson } = await res.json();

        const source = mapInstance.getSource(
          "territory"
        ) as maplibregl.GeoJSONSource | undefined;

        if (source) {
          // Update existing source data (for timeline scrubbing)
          source.setData(geojson);
          return;
        }

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
      "bottom-left"
    );

    map.current.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      "bottom-left"
    );

    map.current.on("load", () => {
      setLoaded(true);
      if (map.current) {
        loadUkraineBorder(map.current);
        loadTerritoryData(map.current);
        loadEquipmentData(map.current);
      }
    });

    return () => {
      popupRef.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Toggle layer visibility
  useEffect(() => {
    if (!map.current || !loaded) return;

    const territoryLayers = ["territory-fill", "territory-line"];
    const equipmentLayers = [
      "equipment-clusters",
      "equipment-cluster-count",
      "equipment-points",
    ];

    territoryLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.territory ? "visible" : "none"
        );
      }
    });

    equipmentLayers.forEach((layer) => {
      if (map.current?.getLayer(layer)) {
        map.current.setLayoutProperty(
          layer,
          "visibility",
          layers.equipment ? "visible" : "none"
        );
      }
    });
  }, [loaded, layers.territory, layers.equipment]);

  // Update territory when timeline date changes
  useEffect(() => {
    if (!map.current || !loaded || !territoryDate) return;
    loadTerritoryData(map.current);
  }, [loaded, territoryDate, loadTerritoryData]);

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
