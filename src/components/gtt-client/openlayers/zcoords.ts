/**
 * Helpers to carry the z-coordinate through 2D editing. Drawing and
 * modifying happen in XY; these preserve an existing z-value across edits.
 */

/**
 * Get the z-value for a given geometry.
 * If the geometry is a Point, return the z-coordinate of the Point.
 * If the geometry is not a Point, return the average z-coordinate of all the coordinates in the geometry.
 * If no z-coordinate is found, return 0.
 *
 * @param {ol/geom/Geometry} geometry - The geometry to get the z-value for.
 *
 * @returns {number} The z-value of the geometry.
 */
export function getZValueForGeometry(geometry: any): number {
  const geometryType = geometry.getType();
  let zValue = 0;

  if (geometryType === 'Point') {
    const coordinates = geometry.getCoordinates();
    zValue = coordinates.length >= 3 ? coordinates[2] : 0;
  } else {
    const coordinates = geometry.getCoordinates();
    let totalZ = 0;
    let numCoordinates = 0;

    if (geometryType === 'LineString' || geometryType === 'LinearRing') {
      coordinates.forEach((coordinate: any) => {
        if (coordinate.length >= 3) {
          totalZ += coordinate[2];
          numCoordinates += 1;
        }
      });
    } else if (geometryType === 'Polygon') {
      coordinates.forEach((ring: any) => {
        ring.forEach((coordinate: any) => {
          if (coordinate.length >= 3) {
            totalZ += coordinate[2];
            numCoordinates += 1;
          }
        });
      });
    } else if (geometryType === 'MultiPoint' || geometryType === 'MultiLineString' || geometryType === 'MultiPolygon') {
      coordinates.forEach((subGeometry: any) => {
        subGeometry.forEach((subCoordinate: any) => {
          if (subCoordinate.length >= 3) {
            totalZ += subCoordinate[2];
            numCoordinates += 1;
          }
        });
      });
    }

    if (numCoordinates > 0) {
      zValue = totalZ / numCoordinates;
    }
  }

  return zValue;
}

/**
 * Set the z-value for a given feature's geometry.
 * If the geometry is a Point, set the z-coordinate of the Point to the given z-value.
 * If the geometry is not a Point, set the z-coordinate of all the coordinates in the geometry to the given z-value.
 *
 * @param {ol/Feature} feature - The feature whose geometry's z-value needs to be set.
 * @param {number} zValue - The z-value to set for the geometry.
 *
 * @returns {ol/Feature} The updated feature object.
 */
export function setZValueForGeometry(feature: any, zValue: number): any {
  const geometry = feature.getGeometry();
  const geometryType = geometry.getType();

  if (geometryType === 'Point') {
    const coordinates = geometry.getCoordinates();
    if (coordinates.length >= 3) {
      coordinates[2] = zValue;
      geometry.setCoordinates(coordinates);
    } else {
      geometry.setCoordinates([coordinates[0], coordinates[1], zValue]);
    }
  } else {
    const coordinates = geometry.getCoordinates();

    if (geometryType === 'LineString' || geometryType === 'LinearRing') {
      geometry.setCoordinates(coordinates.map((coordinate: any) => {
        if (coordinate.length >= 3) {
          return [coordinate[0], coordinate[1], zValue];
        } else {
          return [coordinate[0], coordinate[1], 0];
        }
      }));
    } else if (geometryType === 'Polygon') {
      geometry.setCoordinates(coordinates.map((ring: any) => {
        return ring.map((coordinate: any) => {
          if (coordinate.length >= 3) {
            return [coordinate[0], coordinate[1], zValue];
          } else {
            return [coordinate[0], coordinate[1], 0];
          }
        });
      }));
    } else if (geometryType === 'MultiPoint' || geometryType === 'MultiLineString' || geometryType === 'MultiPolygon') {
      geometry.setCoordinates(coordinates.map((subGeometry: any) => {
        return subGeometry.map((subCoordinate: any) => {
          if (subCoordinate.length >= 3) {
            return [subCoordinate[0], subCoordinate[1], zValue];
          } else {
            return [subCoordinate[0], subCoordinate[1], 0];
          }
        });
      }));
    }
  }

  feature.setGeometry(geometry);
  return feature;
}
