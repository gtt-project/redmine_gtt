// src/components/gtt-client/layers/factories/ol.ts
import * as olLayer from 'ol/layer';
import * as olSource from 'ol/source';
import * as olFormat from 'ol/format';
import { applyStyle, applyBackground } from 'ol-mapbox-style';

import { registerLayerFactory } from '../registry';

/**
 * The default layer factory: constructs a layer from OpenLayers class names
 * stored in the configuration (layer, source, format) with their respective
 * option objects. This preserves the historic map-layer admin format where a
 * configuration names the OL classes directly, e.g.
 * { layer: 'Tile', source: 'OSM' }.
 */
registerLayerFactory('ol', (config) => {
  const LayerClass = olLayer[config.layer as keyof typeof olLayer] as typeof olLayer.Layer;
  if (typeof LayerClass !== 'function') {
    throw new Error(`Unknown OpenLayers layer class: ${config.layer}`);
  }

  const layerOptions = config.layer_options as any;
  layerOptions['visible'] = false;

  if (config.source) {
    const SourceClass = olSource[config.source as keyof typeof olSource] as typeof olSource.Source;
    if (typeof SourceClass !== 'function') {
      throw new Error(`Unknown OpenLayers source class: ${config.source}`);
    }
    const sourceOptions = config.source_options;
    if (config.format) {
      const FormatClass = olFormat[config.format as keyof typeof olFormat] as any;
      if (typeof FormatClass !== 'function') {
        throw new Error(`Unknown OpenLayers format class: ${config.format}`);
      }
      const formatOptions = config.format_options;
      layerOptions['format'] = new FormatClass(formatOptions);
      (sourceOptions as { format?: any })['format'] = layerOptions['format'];
    }
    layerOptions['source'] = new SourceClass(sourceOptions);
  }

  const layer = new LayerClass(layerOptions);

  // Apply style URL if provided
  if ('styleUrl' in layerOptions) {
    applyStyle(layer as any, layerOptions.styleUrl);
    applyBackground(layer as any, layerOptions.styleUrl);
  }

  return layer;
});
