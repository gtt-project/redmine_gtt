// Define an interface named Constants which enforces readonly properties for
// lon, lat, zoom, maxzoom, fitMaxzoom, and geocoder. This interface is used to
// ensure that the 'constants' object conforms to a specific structure.
export interface Constants {
  readonly lon: number;
  readonly lat: number;
  readonly zoom: number;
  readonly maxzoom: number;
  readonly fitMaxzoom: number;
  readonly geocoder: Record<string, unknown>;
}

// Define a constant object named 'constants' of type Constants and specify its values.
// This object holds default values for map-related settings, such as longitude,
// latitude, zoom levels, and geocoder settings.
export const constants: Constants = {
  lon: 139.691706,
  lat: 35.689524,
  zoom: 13,
  maxzoom: 19,
  fitMaxzoom: 17,
  geocoder: {},
};
