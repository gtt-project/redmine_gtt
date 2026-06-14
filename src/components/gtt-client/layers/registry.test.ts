import { describe, it, expect, vi } from 'vitest';

import {
  registerLayerFactory,
  getLayerFactory,
  hasLayerFactory,
  listLayerFactories,
  getLayerSchema,
  listLayerSchemas,
  createLayer,
  DEFAULT_LAYER_TYPE,
} from './registry';
import type { LayerTypeSchema } from './schema';

// The factories return real OpenLayers layers in production; the registry
// only stores and invokes them, so a sentinel object stands in here.
const fakeLayer = (tag: string) => ({ tag }) as any;

const schemaFor = (type: string): LayerTypeSchema => ({
  type,
  label: `${type} label`,
  options: [{ name: 'url', type: 'url', label: 'URL', required: true }],
});

describe('layer factory registry', () => {
  it('defaults to the "ol" layer type', () => {
    expect(DEFAULT_LAYER_TYPE).toBe('ol');
  });

  it('registers, finds, and reports a factory', () => {
    const f = vi.fn();
    registerLayerFactory('reg-find', f);
    expect(getLayerFactory('reg-find')).toBe(f);
    expect(hasLayerFactory('reg-find')).toBe(true);
    expect(hasLayerFactory('reg-absent')).toBe(false);
    expect(listLayerFactories()).toContain('reg-find');
  });

  it('overrides a factory when re-registered under the same type', () => {
    const first = vi.fn();
    const second = vi.fn();
    registerLayerFactory('reg-override', first);
    registerLayerFactory('reg-override', second);
    expect(getLayerFactory('reg-override')).toBe(second);
  });

  describe('schemas', () => {
    it('stores a schema keyed by the registration type, overriding the passed type', () => {
      // The schema carries a deliberately wrong type to prove the registry
      // forces it to the registration name (so the two cannot disagree).
      registerLayerFactory('reg-schema', vi.fn(), { ...schemaFor('wrong'), type: 'wrong' });
      expect(getLayerSchema('reg-schema')?.type).toBe('reg-schema');
      expect(listLayerSchemas().map((s) => s.type)).toContain('reg-schema');
    });

    it('drops a stale schema when a factory is re-registered without one', () => {
      // Regression guard: an override without a schema must not leave the old
      // schema behind.
      registerLayerFactory('reg-stale', vi.fn(), schemaFor('reg-stale'));
      expect(getLayerSchema('reg-stale')).toBeDefined();
      registerLayerFactory('reg-stale', vi.fn());
      expect(getLayerSchema('reg-stale')).toBeUndefined();
      expect(listLayerSchemas().map((s) => s.type)).not.toContain('reg-stale');
    });

    it('has no schema for a factory registered without one', () => {
      registerLayerFactory('reg-noschema', vi.fn());
      expect(getLayerSchema('reg-noschema')).toBeUndefined();
    });
  });

  describe('createLayer', () => {
    it('falls back to the default type for null/undefined/empty type', () => {
      const ol = vi.fn(() => fakeLayer('ol'));
      registerLayerFactory(DEFAULT_LAYER_TYPE, ol);

      for (const type of [undefined, null, ''] as any[]) {
        ol.mockClear();
        const layer = createLayer({ name: 'L', type } as any);
        expect(ol).toHaveBeenCalledOnce();
        expect(layer).toEqual({ tag: 'ol' });
      }
    });

    it('dispatches to the factory matching config.type', () => {
      const xyz = vi.fn(() => fakeLayer('xyz'));
      registerLayerFactory('reg-xyz', xyz);
      const layer = createLayer({ name: 'L', type: 'reg-xyz' } as any);
      expect(xyz).toHaveBeenCalledOnce();
      expect(layer).toEqual({ tag: 'xyz' });
    });

    it('returns null and logs for an unknown type, without throwing', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const layer = createLayer({ name: 'L', type: 'reg-does-not-exist' } as any);
      expect(layer).toBeNull();
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
    });

    it('returns null and logs when the factory throws, isolating the failure', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      registerLayerFactory('reg-throws', () => {
        throw new Error('bad config');
      });
      const layer = createLayer({ name: 'L', type: 'reg-throws' } as any);
      expect(layer).toBeNull();
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
    });
  });
});
