// src/components/gtt-client/layers/factories/wms.ts
import TileLayer from 'ol/layer/Tile';
import TileWMS from 'ol/source/TileWMS';

import { registerLayerFactory } from '../registry';

/**
 * Named "wms" layer type: a tiled WMS layer. The admin provides the service
 * URL and the comma-separated layer names; the rest carry sensible defaults.
 */
registerLayerFactory(
  'wms',
  (config) => {
    const options = (config.layer_options ?? {}) as any;
    if (!options.url) {
      throw new Error('wms layer requires a "url" option');
    }
    if (!options.layers) {
      throw new Error('wms layer requires a "layers" option');
    }
    return new TileLayer({
      visible: false,
      source: new TileWMS({
        url: options.url,
        attributions: options.attributions,
        params: {
          LAYERS: options.layers,
          VERSION: options.version ?? '1.3.0',
          FORMAT: options.format ?? 'image/png',
          TRANSPARENT: options.transparent ?? true,
          ...(options.params ?? {}),
        },
      }),
    });
  },
  {
    type: 'wms',
    label: 'WMS',
    options: [
      { name: 'url', type: 'url', label: 'Service URL', required: true },
      {
        name: 'layers',
        type: 'string',
        label: 'Layers',
        required: true,
        help: 'Comma-separated WMS layer names',
      },
      { name: 'version', type: 'string', label: 'Version', default: '1.3.0' },
      { name: 'format', type: 'string', label: 'Image format', default: 'image/png' },
      { name: 'transparent', type: 'boolean', label: 'Transparent', default: true },
      { name: 'attributions', type: 'string', label: 'Attributions' },
    ],
  }
);
