// Re-expose GeoJSON types as a global namespace. Earlier dependency trees made
// the `GeoJSON` UMD global from @types/geojson resolvable in module files;
// maplibre-gl v6 no longer pulls it in, so declare it explicitly.
import type * as geojson from "geojson";

declare global {
  namespace GeoJSON {
    type BBox = geojson.BBox;
    type Position = geojson.Position;
    type GeoJsonProperties = geojson.GeoJsonProperties;
    type Geometry = geojson.Geometry;
    type Point = geojson.Point;
    type MultiPoint = geojson.MultiPoint;
    type LineString = geojson.LineString;
    type MultiLineString = geojson.MultiLineString;
    type Polygon = geojson.Polygon;
    type MultiPolygon = geojson.MultiPolygon;
    type GeometryCollection = geojson.GeometryCollection;
    type Feature<
      G extends geojson.Geometry | null = geojson.Geometry,
      P = geojson.GeoJsonProperties,
    > = geojson.Feature<G, P>;
    type FeatureCollection<
      G extends geojson.Geometry | null = geojson.Geometry,
      P = geojson.GeoJsonProperties,
    > = geojson.FeatureCollection<G, P>;
  }
}
