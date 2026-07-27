// src/components/gtt-client/layers/factories/xyz.ts
import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';

import { registerLayerFactory } from '../registry';

/**
 * Named "xyz" layer type: a tiled raster layer from an XYZ URL template.
 * Covers the common case of a slippy-map tile server without requiring the
 * admin to know the OpenLayers class names.
 */
registerLayerFactory(
  'xyz',
  (config) => {
    const options = (config.layer_options ?? {}) as any;
    if (!options.url) {
      throw new Error('xyz layer requires a "url" option');
    }
    return new TileLayer({
      visible: false,
      source: new XYZ({
        url: options.url,
        attributions: options.attributions,
        maxZoom: options.maxZoom,
        minZoom: options.minZoom,
      }),
    });
  },
  {
    type: 'xyz',
    label: 'XYZ tiles',
    options: [
      {
        name: 'url',
        type: 'url',
        label: 'Tile URL template',
        required: true,
        help: 'e.g. https://tile.openstreetmap.org/{z}/{x}/{y}.png',
      },
      { name: 'attributions', type: 'string', label: 'Attributions' },
      { name: 'maxZoom', type: 'number', label: 'Max zoom' },
      { name: 'minZoom', type: 'number', label: 'Min zoom' },
    ],
  }
);
