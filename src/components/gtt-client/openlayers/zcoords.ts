/**
 * Helpers to carry the z-coordinate through 2D editing. Drawing and
 * modifying happen in XY; these preserve an existing z-value across edits.
 *
 * Coordinates are walked recursively, so any nesting depth works
 * (Point, LineString, Polygon and their Multi* variants).
 */

/** Visit every leaf coordinate ([x, y, z?]) in a coordinates array. */
function eachCoordinate(coordinates: any, visit: (coordinate: number[]) => void): void {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return;
  }
  if (typeof coordinates[0] === 'number') {
    visit(coordinates);
    return;
  }
  coordinates.forEach((nested: any) => eachCoordinate(nested, visit));
}

/** Return a copy of a coordinates array with every leaf set to [x, y, zValue]. */
function mapToZ(coordinates: any, zValue: number): any {
  if (!Array.isArray(coordinates) || coordinates.length === 0) {
    return coordinates;
  }
  if (typeof coordinates[0] === 'number') {
    return [coordinates[0], coordinates[1], zValue];
  }
  return coordinates.map((nested: any) => mapToZ(nested, zValue));
}

/**
 * Get the z-value for a given geometry.
 * If the geometry is a Point, return the z-coordinate of the Point.
 * Otherwise return the average z-coordinate of all coordinates in the
 * geometry. If no z-coordinate is found, return 0.
 *
 * @param {ol/geom/Geometry} geometry - The geometry to get the z-value for.
 *
 * @returns {number} The z-value of the geometry.
 */
export function getZValueForGeometry(geometry: any): number {
  let totalZ = 0;
  let numCoordinates = 0;

  eachCoordinate(geometry.getCoordinates(), (coordinate) => {
    if (coordinate.length >= 3) {
      totalZ += coordinate[2];
      numCoordinates += 1;
    }
  });

  return numCoordinates > 0 ? totalZ / numCoordinates : 0;
}

/**
 * Set the z-value for a given feature's geometry.
 * Every coordinate in the geometry is set to the given z-value,
 * regardless of whether it previously had one.
 *
 * @param {ol/Feature} feature - The feature whose geometry's z-value needs to be set.
 * @param {number} zValue - The z-value to set for the geometry.
 *
 * @returns {ol/Feature} The updated feature object.
 */
export function setZValueForGeometry(feature: any, zValue: number): any {
  const geometry = feature.getGeometry();
  geometry.setCoordinates(mapToZ(geometry.getCoordinates(), zValue));
  feature.setGeometry(geometry);
  return feature;
}
