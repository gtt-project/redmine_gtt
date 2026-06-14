// src/components/gtt-client/events/bus.ts
import type { GttEventMap } from './types';

type GttEventHandler<K extends keyof GttEventMap> = (payload: GttEventMap[K]) => void;

/**
 * A small typed publish/subscribe bus for GttClient lifecycle and interaction
 * events. Each GttClient owns one bus.
 *
 * Two ways to subscribe:
 *
 * 1. In-process, when you hold the client reference and want typed payloads:
 *      client.events.on(GttEvent.GeometryChange, ({ feature }) => { ... })
 *
 * 2. From a sibling plugin or host script that has no reference to the client
 *    and no access to this bundle's modules: every emit also dispatches a DOM
 *    CustomEvent of the same name on the map element. It bubbles, so a single
 *    document-level listener registered at page load catches maps that attach
 *    later:
 *      document.addEventListener('gtt:geometry:change', e => e.detail.feature)
 *
 * This keeps extension points open without monkey-patching the client.
 */
export class GttEventBus {
  private readonly handlers = new Map<string, Set<GttEventHandler<any>>>();

  /**
   * @param domTarget Element the CustomEvents are dispatched on. Pass the map
   * target element so events bubble to document; pass null to disable DOM
   * dispatch (e.g. in unit tests).
   */
  constructor(private readonly domTarget: HTMLElement | null = null) {}

  /**
   * Subscribe to an event. Returns an unsubscribe function so callers can tear
   * down without retaining the original handler reference.
   */
  on<K extends keyof GttEventMap>(type: K, handler: GttEventHandler<K>): () => void {
    let set = this.handlers.get(type);
    if (!set) {
      set = new Set();
      this.handlers.set(type, set);
    }
    set.add(handler);
    return () => this.off(type, handler);
  }

  /** Subscribe to the next occurrence of an event only. */
  once<K extends keyof GttEventMap>(type: K, handler: GttEventHandler<K>): () => void {
    const off = this.on(type, (payload) => {
      off();
      handler(payload);
    });
    return off;
  }

  /** Remove a previously registered handler. */
  off<K extends keyof GttEventMap>(type: K, handler: GttEventHandler<K>): void {
    this.handlers.get(type)?.delete(handler);
  }

  /**
   * Publish an event to in-process subscribers and, when a DOM target is set,
   * as a bubbling CustomEvent. A throwing handler is logged and skipped so one
   * bad subscriber cannot break the others or the caller.
   */
  emit<K extends keyof GttEventMap>(type: K, payload: GttEventMap[K]): void {
    this.handlers.get(type)?.forEach((handler) => {
      try {
        handler(payload);
      } catch (error) {
        console.error(`[GTT] event handler for "${String(type)}" threw:`, error);
      }
    });

    this.domTarget?.dispatchEvent(
      new CustomEvent(type as string, { detail: payload, bubbles: true })
    );
  }
}
