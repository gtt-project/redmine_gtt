import { describe, it, expect, vi } from 'vitest';

import { GttEventBus } from './bus';
import { GttEvent } from './types';

// Lifecycle payloads carry live client/map objects in production; tests only
// check delivery, so a marker object cast to the payload type is enough.
const payload = (tag: string) => ({ client: {}, map: {}, tag }) as any;

describe('GttEventBus', () => {
  describe('in-process subscribers', () => {
    it('delivers the payload to a subscriber', () => {
      const bus = new GttEventBus();
      const handler = vi.fn();
      bus.on(GttEvent.MapReady, handler);
      const p = payload('ready');
      bus.emit(GttEvent.MapReady, p);
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(p);
    });

    it('only delivers to subscribers of the emitted event', () => {
      const bus = new GttEventBus();
      const other = vi.fn();
      bus.on(GttEvent.FeatureSelect, other);
      bus.emit(GttEvent.MapReady, payload('ready'));
      expect(other).not.toHaveBeenCalled();
    });

    it('returns an unsubscribe function from on()', () => {
      const bus = new GttEventBus();
      const handler = vi.fn();
      const off = bus.on(GttEvent.GeometryChange, handler);
      off();
      bus.emit(GttEvent.GeometryChange, payload('geom'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('removes a handler with off()', () => {
      const bus = new GttEventBus();
      const handler = vi.fn();
      bus.on(GttEvent.GeometryChange, handler);
      bus.off(GttEvent.GeometryChange, handler);
      bus.emit(GttEvent.GeometryChange, payload('geom'));
      expect(handler).not.toHaveBeenCalled();
    });

    it('fires a once() handler only on the first emit', () => {
      const bus = new GttEventBus();
      const handler = vi.fn();
      bus.once(GttEvent.LayersReady, handler);
      bus.emit(GttEvent.LayersReady, payload('1'));
      bus.emit(GttEvent.LayersReady, payload('2'));
      expect(handler).toHaveBeenCalledOnce();
    });

    it('delivers to every subscriber of an event', () => {
      const bus = new GttEventBus();
      const a = vi.fn();
      const b = vi.fn();
      bus.on(GttEvent.MapReady, a);
      bus.on(GttEvent.MapReady, b);
      bus.emit(GttEvent.MapReady, payload('ready'));
      expect(a).toHaveBeenCalledOnce();
      expect(b).toHaveBeenCalledOnce();
    });

    it('isolates a throwing handler: it is logged and the others still run', () => {
      const error = vi.spyOn(console, 'error').mockImplementation(() => {});
      const bus = new GttEventBus();
      const bad = vi.fn(() => { throw new Error('boom'); });
      const good = vi.fn();
      bus.on(GttEvent.MapReady, bad);
      bus.on(GttEvent.MapReady, good);
      expect(() => bus.emit(GttEvent.MapReady, payload('ready'))).not.toThrow();
      expect(good).toHaveBeenCalledOnce();
      expect(error).toHaveBeenCalledOnce();
      error.mockRestore();
    });

    it('does not throw when emitting with no subscribers', () => {
      const bus = new GttEventBus();
      expect(() => bus.emit(GttEvent.MapReady, payload('ready'))).not.toThrow();
    });
  });

  describe('DOM CustomEvent dispatch', () => {
    it('dispatches a bubbling CustomEvent carrying the payload on the DOM target', () => {
      const target = new EventTarget();
      const bus = new GttEventBus(target as any);
      const received: CustomEvent[] = [];
      target.addEventListener(GttEvent.GeometryChange, (e) => received.push(e as CustomEvent));
      const p = payload('geom');
      bus.emit(GttEvent.GeometryChange, p);
      expect(received).toHaveLength(1);
      expect(received[0].detail).toBe(p);
      expect(received[0].bubbles).toBe(true);
    });

    it('does not dispatch a DOM event when no target is set', () => {
      // A null target must simply skip DOM dispatch (no throw); the in-process
      // handler still fires.
      const bus = new GttEventBus(null);
      const handler = vi.fn();
      bus.on(GttEvent.MapReady, handler);
      expect(() => bus.emit(GttEvent.MapReady, payload('ready'))).not.toThrow();
      expect(handler).toHaveBeenCalledOnce();
    });
  });
});
