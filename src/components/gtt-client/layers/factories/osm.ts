// src/components/gtt-client/layers/factories/osm.ts
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import { registerLayerFactory } from '../registry';

/**
 * Named "osm" layer type: the OpenStreetMap standard tile layer. Both options
 * are optional; with none set it uses the OpenLayers OSM defaults.
 */
registerLayerFactory(
  'osm',
  (config) => {
    const options = (config.layer_options ?? {}) as any;
    return new TileLayer({
      visible: false,
      source: new OSM({
        url: options.url,
        attributions: options.attributions,
      }),
    });
  },
  {
    type: 'osm',
    label: 'OpenStreetMap',
    options: [
      { name: 'url', type: 'url', label: 'Tile URL template (optional override)' },
      { name: 'attributions', type: 'string', label: 'Attributions (optional override)' },
    ],
  }
);
