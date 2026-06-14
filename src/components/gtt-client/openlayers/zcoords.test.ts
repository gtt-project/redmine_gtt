import { describe, it, expect, vi } from 'vitest';

import { getZValueForGeometry, setZValueForGeometry } from './zcoords';

// The helpers only call getCoordinates/setCoordinates on the geometry and
// getGeometry/setGeometry on the feature, so plain stand-ins stand in for the
// OpenLayers objects.
function fakeGeometry(coordinates: any) {
  let coords = coordinates;
  return {
    getCoordinates: () => coords,
    setCoordinates: vi.fn((next: any) => { coords = next; }),
  };
}

function fakeFeature(geometry: any) {
  return {
    getGeometry: () => geometry,
    setGeometry: vi.fn(),
  };
}

describe('getZValueForGeometry', () => {
  it('returns the z of a 3D point', () => {
    expect(getZValueForGeometry(fakeGeometry([1, 2, 5]))).toBe(5);
  });

  it('returns 0 for a 2D point (no z present)', () => {
    expect(getZValueForGeometry(fakeGeometry([1, 2]))).toBe(0);
  });

  it('averages the z values of a LineString', () => {
    expect(getZValueForGeometry(fakeGeometry([[1, 2, 10], [3, 4, 20]]))).toBe(15);
  });

  it('averages the z values of a Polygon ring', () => {
    const ring = [[1, 2, 4], [3, 4, 6], [5, 6, 8], [1, 2, 4]];
    expect(getZValueForGeometry(fakeGeometry([ring]))).toBe(5.5);
  });

  it('walks into a MultiPolygon (the nesting depth that used to be missed)', () => {
    const multiPolygon = [
      [[[1, 2, 2], [3, 4, 4]]],
      [[[5, 6, 6], [7, 8, 8]]],
    ];
    expect(getZValueForGeometry(fakeGeometry(multiPolygon))).toBe(5);
  });

  it('walks into a MultiPoint', () => {
    expect(getZValueForGeometry(fakeGeometry([[1, 2, 3], [4, 5, 9]]))).toBe(6);
  });

  it('only counts coordinates that carry a z', () => {
    expect(getZValueForGeometry(fakeGeometry([[1, 2, 10], [3, 4]]))).toBe(10);
  });

  it('returns 0 for empty coordinates', () => {
    expect(getZValueForGeometry(fakeGeometry([]))).toBe(0);
  });
});

describe('setZValueForGeometry', () => {
  it('adds a z to a 2D point', () => {
    const geometry = fakeGeometry([1, 2]);
    const feature = fakeFeature(geometry);

    const result = setZValueForGeometry(feature, 99);

    expect(geometry.setCoordinates).toHaveBeenCalledWith([1, 2, 99]);
    expect(feature.setGeometry).toHaveBeenCalledWith(geometry);
    expect(result).toBe(feature);
  });

  it('replaces an existing z on a point', () => {
    const geometry = fakeGeometry([1, 2, 5]);
    setZValueForGeometry(fakeFeature(geometry), 99);
    expect(geometry.setCoordinates).toHaveBeenCalledWith([1, 2, 99]);
  });

  it('sets the z on every vertex of a LineString', () => {
    const geometry = fakeGeometry([[1, 2, 0], [3, 4, 0]]);
    setZValueForGeometry(fakeFeature(geometry), 7);
    expect(geometry.setCoordinates).toHaveBeenCalledWith([[1, 2, 7], [3, 4, 7]]);
  });

  it('sets the z on every leaf of a MultiPolygon', () => {
    const geometry = fakeGeometry([
      [[[1, 2, 0], [3, 4, 0]]],
      [[[5, 6], [7, 8]]],
    ]);
    setZValueForGeometry(fakeFeature(geometry), 3);
    expect(geometry.setCoordinates).toHaveBeenCalledWith([
      [[[1, 2, 3], [3, 4, 3]]],
      [[[5, 6, 3], [7, 8, 3]]],
    ]);
  });
});
