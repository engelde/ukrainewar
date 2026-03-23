import type maplibregl from "maplibre-gl";
import type { Battle } from "@/data/battles";
import type { MilitaryOperation } from "@/data/operations";
import { formatDateRange } from "@/lib/utils";

export function battleGeoJSON(
  battles: Battle[],
  timelineDate?: string | null,
): GeoJSON.FeatureCollection {
  const filtered = timelineDate ? battles.filter((b) => b.startDate <= timelineDate) : battles;

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
        dateRange: formatDateRange(b.startDate, b.endDate),
      },
    })),
  };
}

const MONTH_NAMES: Record<string, number> = {
  January: 1,
  February: 2,
  March: 3,
  April: 4,
  May: 5,
  June: 6,
  July: 7,
  August: 8,
  September: 9,
  October: 10,
  November: 11,
  December: 12,
};

export function monthIndex(name: string): number {
  return MONTH_NAMES[name] ?? 0;
}

// Convert operations to GeoJSON lines with arrow-friendly properties
export function operationsGeoJSON(
  ops: MilitaryOperation[],
  timelineDate?: string | null,
): GeoJSON.FeatureCollection {
  // Default to today so completed operations are hidden on initial load
  const now = new Date();
  const effectiveDate =
    timelineDate ??
    `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const filtered = ops.filter(
    (o) => o.startDate <= effectiveDate && (!o.endDate || o.endDate >= effectiveDate),
  );

  return {
    type: "FeatureCollection",
    features: filtered.map((op) => {
      // All filtered operations are active within the date range
      const active = true;

      // Compute progress along waypoints
      let progress = 1;
      if (op.endDate) {
        const start = Number.parseInt(op.startDate, 10);
        const end = Number.parseInt(op.endDate, 10);
        const current = Number.parseInt(effectiveDate, 10);
        progress =
          end === start ? 1 : Math.min(1, Math.max(0.05, (current - start) / (end - start)));
      }

      // Build coordinate array (trimmed to progress for active ops)
      const allCoords = op.waypoints.map((wp) => [wp.lng, wp.lat]);
      let coords = allCoords;
      if (active && progress < 1 && allCoords.length > 1) {
        // Interpolate along the path based on progress
        const totalSegments = allCoords.length - 1;
        const targetSegment = progress * totalSegments;
        const segIndex = Math.floor(targetSegment);
        const segFrac = targetSegment - segIndex;
        coords = allCoords.slice(0, segIndex + 1);
        if (segIndex < totalSegments) {
          const from = allCoords[segIndex];
          const to = allCoords[segIndex + 1];
          coords.push([
            from[0] + (to[0] - from[0]) * segFrac,
            from[1] + (to[1] - from[1]) * segFrac,
          ]);
        }
      }

      return {
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: coords,
        },
        properties: {
          id: op.id,
          name: op.name,
          side: op.side,
          type: op.type,
          startDate: op.startDate,
          active,
          significance: op.significance,
          description: op.description,
          outcome: op.outcome || "",
          dateRange: formatDateRange(op.startDate, op.endDate),
        },
      };
    }),
  };
}

// Generate arrowhead points at the end of each operation line
export function operationArrowheadsGeoJSON(
  ops: MilitaryOperation[],
  timelineDate?: string | null,
): GeoJSON.FeatureCollection {
  const lines = operationsGeoJSON(ops, timelineDate);

  return {
    type: "FeatureCollection",
    features: lines.features
      .filter((f) => (f.geometry as GeoJSON.LineString).coordinates.length >= 2)
      .map((f) => {
        const coords = (f.geometry as GeoJSON.LineString).coordinates;
        const tip = coords[coords.length - 1];
        const prev = coords[coords.length - 2];
        // Calculate bearing for arrow rotation
        const dx = tip[0] - prev[0];
        const dy = tip[1] - prev[1];
        const bearing = (Math.atan2(dx, dy) * 180) / Math.PI;

        return {
          type: "Feature" as const,
          geometry: {
            type: "Point" as const,
            coordinates: tip,
          },
          properties: {
            ...f.properties,
            bearing,
          },
        };
      }),
  };
}

export function findFirstSymbolLayer(mapInstance: maplibregl.Map): string | undefined {
  const layers = mapInstance.getStyle().layers;
  if (!layers) return undefined;
  for (const layer of layers) {
    if (layer.type === "symbol") return layer.id;
  }
  return undefined;
}
