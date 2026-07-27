import { describe, it, expect } from 'vitest';

import {
  registerGeocoderProvider,
  getGeocoderProvider,
  hasGeocoderProvider,
  listGeocoderProviders,
} from './registry';

// The registry is a module-level Map shared across this file, so each test
// uses a distinct provider name and list assertions check membership rather
// than exact contents.
const factory = (label: string) => (options: any) => ({
  control: { label },
  providerOptions: options,
});

describe('geocoder provider registry', () => {
  it('registers and retrieves a provider factory', () => {
    const f = factory('a');
    registerGeocoderProvider('reg-a', f);
    expect(getGeocoderProvider('reg-a')).toBe(f);
  });

  it('reports registration with hasGeocoderProvider', () => {
    registerGeocoderProvider('reg-has', factory('h'));
    expect(hasGeocoderProvider('reg-has')).toBe(true);
    expect(hasGeocoderProvider('reg-absent')).toBe(false);
  });

  it('returns undefined for an unknown provider', () => {
    expect(getGeocoderProvider('reg-unknown')).toBeUndefined();
  });

  it('overrides a provider when the same name is registered again', () => {
    const first = factory('first');
    const second = factory('second');
    registerGeocoderProvider('reg-override', first);
    registerGeocoderProvider('reg-override', second);
    expect(getGeocoderProvider('reg-override')).toBe(second);
  });

  it('lists registered provider names', () => {
    registerGeocoderProvider('reg-list-1', factory('1'));
    registerGeocoderProvider('reg-list-2', factory('2'));
    const names = listGeocoderProviders();
    expect(names).toContain('reg-list-1');
    expect(names).toContain('reg-list-2');
  });

  it('passes the provider options through to the factory result', () => {
    registerGeocoderProvider('reg-opts', factory('o'));
    const result = getGeocoderProvider('reg-opts')!({ reverse: true });
    expect(result.providerOptions).toEqual({ reverse: true });
  });
});
