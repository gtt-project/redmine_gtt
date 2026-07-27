import { describe, expect, it } from 'vitest';

import { METERS_PER_UNIT, metersToUnitValue } from './filters';

describe('METERS_PER_UNIT', () => {
  it('mirrors the server-side unit table', () => {
    expect(METERS_PER_UNIT).toEqual({
      m: 1,
      km: 1000,
      ft: 0.3048,
      mi: 1609.344,
      nm: 1852,
    });
  });
});

describe('metersToUnitValue', () => {
  it('converts meters into the unit', () => {
    expect(metersToUnitValue('1500', METERS_PER_UNIT.km)).toBe('1.5');
    expect(metersToUnitValue('1609.344', METERS_PER_UNIT.mi)).toBe('1');
    expect(metersToUnitValue('1852', METERS_PER_UNIT.nm)).toBe('1');
    expect(metersToUnitValue('25', METERS_PER_UNIT.m)).toBe('25');
  });

  it('trims float noise from round trips', () => {
    // 25 km -> 25000 m -> back: must not display 24.999999999
    expect(metersToUnitValue('25000', METERS_PER_UNIT.km)).toBe('25');
    expect(metersToUnitValue('804672', METERS_PER_UNIT.mi)).toBe('500');
  });

  it('passes empty and non-numeric values through unchanged', () => {
    expect(metersToUnitValue('', METERS_PER_UNIT.km)).toBe('');
    expect(metersToUnitValue('abc', METERS_PER_UNIT.km)).toBe('abc');
  });
});
