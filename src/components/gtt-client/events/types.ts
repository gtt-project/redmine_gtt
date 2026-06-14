// src/components/gtt-client/events/types.ts
import type { Map } from 'ol';
import type Feature from 'ol/Feature';
import type { Layer } from 'ol/layer';
import type { Feature as GeoJSONFeature } from 'geojson';

import type GttClient from '../GttClient';

/**
 * Canonical names of the events the GttClient publishes. They are exposed as
 * constants (rather than bare strings) so consumers do not hard-code magic
 * strings; the values are namespaced with `gtt:` so DOM listeners on a shared
 * element do not collide with other libraries.
 */
export const GttEvent = {
  /** The map has been constructed; layers and controls are in place. */
  MapReady: 'gtt:map:ready',
  /** Configured layers have been created and added to the map. */
  LayersReady: 'gtt:layers:ready',
  /** The edited geometry changed (drawn, modified, or cleared). */
  GeometryChange: 'gtt:geometry:change',
  /** Map features were selected or deselected. */
  FeatureSelect: 'gtt:feature:select',
} as const;

export type GttEventName = (typeof GttEvent)[keyof typeof GttEvent];

/** Fields present on every payload. */
interface GttEventBase {
  client: GttClient;
  map: Map;
}

/**
 * Maps each event name to the shape of its payload. Handlers registered via
 * GttEventBus#on are typed against this map; the same payload is the `detail`
 * of the dispatched DOM CustomEvent.
 */
export interface GttEventMap {
  [GttEvent.MapReady]: GttEventBase & { target: HTMLElement };
  [GttEvent.LayersReady]: GttEventBase & { layers: Layer[] };
  [GttEvent.GeometryChange]: GttEventBase & {
    /** GeoJSON Feature for the current geometry, or null when cleared. */
    feature: GeoJSONFeature | null;
    /** The OpenLayers features backing the change (empty when cleared). */
    features: Feature[];
  };
  [GttEvent.FeatureSelect]: GttEventBase & {
    selected: Feature[];
    deselected: Feature[];
  };
}
