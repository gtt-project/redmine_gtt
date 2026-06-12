// src/components/gtt-client/layers/registry.ts
import { Layer } from 'ol/layer';

import type { ILayerObject } from '../interfaces';
import type { LayerTypeSchema } from './schema';

/**
 * A layer factory takes one layer configuration (a row from the map-layer
 * admin table) and returns the constructed OpenLayers layer, or null when the
 * configuration cannot be turned into a layer. Generic post-processing
 * (lid/title/baseLayer properties, basemap cookie wiring, adding to the map)
 * is applied by the caller and must not be done here.
 */
export type LayerFactory = (config: ILayerObject) => Layer | null;

/**
 * The factory used when a layer configuration does not specify a type.
 * It constructs layers from OpenLayers class names (see factories/ol.ts).
 */
export const DEFAULT_LAYER_TYPE = 'ol';

const registry = new Map<string, LayerFactory>();
const schemas = new Map<string, LayerTypeSchema>();

/**
 * Registers a layer factory under the given type name. Registering an
 * existing name overrides the previous factory, which lets host applications
 * swap a built-in factory for their own implementation.
 *
 * Named layer types pass a schema describing their options so the layer admin
 * UI can render a form. The default 'ol' factory has no schema because it
 * accepts raw OpenLayers constructor options.
 * @param type - Layer type identifier as used in the layer configuration.
 * @param factory - Factory creating a layer from one configuration entry.
 * @param schema - Optional option schema for the layer admin UI.
 */
export function registerLayerFactory(type: string, factory: LayerFactory, schema?: LayerTypeSchema): void {
  registry.set(type, factory);
  // Drop any schema from a previously registered factory of the same name so
  // an override without a schema does not leave a stale one behind. When a
  // schema is given, key it by the registration type so the two cannot
  // disagree.
  schemas.delete(type);
  if (schema) {
    schemas.set(type, { ...schema, type });
  }
}

/**
 * Returns the option schema registered for the given type, or undefined when
 * the type has no schema (e.g. the raw 'ol' factory).
 * @param type - Layer type identifier.
 */
export function getLayerSchema(type: string): LayerTypeSchema | undefined {
  return schemas.get(type);
}

/**
 * Returns the schemas of all registered named layer types, in registration
 * order. Intended for the layer admin UI type selector.
 */
export function listLayerSchemas(): LayerTypeSchema[] {
  return Array.from(schemas.values());
}

/**
 * Returns the factory registered for the given type, or undefined.
 * @param type - Layer type identifier.
 */
export function getLayerFactory(type: string): LayerFactory | undefined {
  return registry.get(type);
}

/**
 * Returns true if a factory is registered under the given type.
 * @param type - Layer type identifier.
 */
export function hasLayerFactory(type: string): boolean {
  return registry.has(type);
}

/**
 * Returns the names of all registered layer types.
 */
export function listLayerFactories(): string[] {
  return Array.from(registry.keys());
}

/**
 * Creates a layer for the given configuration via the registered factories.
 * Returns null (after logging) for unknown types or failing factories so one
 * broken layer configuration does not prevent the rest of the map from
 * loading.
 * @param config - One layer configuration entry.
 */
export function createLayer(config: ILayerObject): Layer | null {
  // null (NULL column), undefined, or empty string all fall back to 'ol'.
  const type = config.type || DEFAULT_LAYER_TYPE;
  const factory = registry.get(type);
  if (!factory) {
    console.error(
      `[GTT] Unknown layer type "${type}" for layer "${config.name}". Registered types: ${listLayerFactories().join(', ')}`
    );
    return null;
  }
  try {
    return factory(config);
  } catch (error) {
    console.error(`[GTT] Failed to create layer "${config.name}" (type "${type}"):`, error);
    return null;
  }
}
