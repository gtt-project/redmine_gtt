// src/components/gtt-client/layers/schema.ts

/**
 * The kind of value a layer option holds. Used by the (upcoming) layer admin
 * UI to pick an input widget and coerce the stored value. 'json' holds a
 * nested object edited as raw JSON (e.g. extra WMS request parameters).
 */
export type LayerOptionType = 'string' | 'number' | 'boolean' | 'url' | 'json';

/**
 * One configurable option of a named layer type.
 */
export interface LayerOptionField {
  /** Key under the layer's layer_options object. */
  name: string;
  /** Value kind, drives the admin input widget. */
  type: LayerOptionType;
  /** Human-readable label for the admin form. */
  label: string;
  /** Whether the option must be provided for the layer to build. */
  required?: boolean;
  /** Default applied by the factory when the option is omitted. */
  default?: string | number | boolean;
  /** Optional hint shown beneath the field. */
  help?: string;
}

/**
 * Declarative description of a named layer type: its identifier, a label, and
 * the options it accepts. Built-in named factories register one of these
 * alongside their factory so the layer admin UI can render a form instead of
 * requiring hand-written OpenLayers constructor JSON.
 */
export interface LayerTypeSchema {
  /** Layer type identifier, matches the registered factory name. */
  type: string;
  /** Human-readable label for the type selector. */
  label: string;
  /** Options accepted under the layer's layer_options object. */
  options: LayerOptionField[];
}
