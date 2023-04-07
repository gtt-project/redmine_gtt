// Define an interface named Constants which enforces readonly properties for lon, lat, zoom, maxzoom, fitMaxzoom and geocoder.
export interface Constants {
  readonly lon: number;
  readonly lat: number;
  readonly zoom: number;
  readonly maxzoom: number;
  readonly fitMaxzoom: number;
  readonly geocoder: Record<string, unknown>;
}

// Define a constant object named constants of type Constants and specify its values.
export const constants: Constants = {
  lon: 139.691706,
  lat: 35.689524,
  zoom: 13,
  maxzoom: 19,
  fitMaxzoom: 17,
  geocoder: {},
};
