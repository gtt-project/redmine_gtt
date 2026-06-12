// src/components/gtt-client/layers/factories/wmts.ts
import TileLayer from 'ol/layer/Tile';
import WMTS, { optionsFromCapabilities } from 'ol/source/WMTS';
import WMTSCapabilities from 'ol/format/WMTSCapabilities';

import { registerLayerFactory } from '../registry';

/**
 * Named "wmts" layer type: a tiled WMTS layer configured from the service's
 * GetCapabilities document, so the admin does not have to spell out the tile
 * grid (resolutions, matrix IDs) by hand.
 *
 * Factories are synchronous but fetching the capabilities is not, so the
 * layer is returned without a source and the source is attached once the
 * capabilities resolve. On fetch or parse failure the layer stays empty and
 * the error is logged; the rest of the map is unaffected.
 */
registerLayerFactory(
  'wmts',
  (config) => {
    const options = (config.layer_options ?? {}) as any;
    if (!options.url) {
      throw new Error('wmts layer requires a "url" option (GetCapabilities URL)');
    }
    if (!options.layer) {
      throw new Error('wmts layer requires a "layer" option');
    }

    const layer = new TileLayer({ visible: false });

    fetch(options.url)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`capabilities request failed with HTTP ${response.status}`);
        }
        return response.text();
      })
      .then((text) => {
        const capabilities = new WMTSCapabilities().read(text);
        const sourceOptions = optionsFromCapabilities(capabilities, {
          layer: options.layer,
          matrixSet: options.matrixSet,
          format: options.format,
          style: options.style,
        });
        if (!sourceOptions) {
          throw new Error(`layer "${options.layer}" not found in capabilities`);
        }
        if (options.attributions) {
          sourceOptions.attributions = options.attributions;
        }
        layer.setSource(new WMTS(sourceOptions));
      })
      .catch((error) => {
        console.error(`[GTT] Failed to initialize wmts layer "${config.name}":`, error);
      });

    return layer;
  },
  {
    type: 'wmts',
    label: 'WMTS',
    options: [
      {
        name: 'url',
        type: 'url',
        label: 'GetCapabilities URL',
        required: true,
        help: 'e.g. https://example.com/wmts/1.0.0/WMTSCapabilities.xml',
      },
      {
        name: 'layer',
        type: 'string',
        label: 'Layer identifier',
        required: true,
        help: 'Layer identifier as listed in the capabilities document',
      },
      {
        name: 'matrixSet',
        type: 'string',
        label: 'Matrix set',
        help: 'Defaults to the first matrix set compatible with the map projection',
      },
      { name: 'style', type: 'string', label: 'Style' },
      { name: 'format', type: 'string', label: 'Image format', help: 'e.g. image/png' },
      { name: 'attributions', type: 'string', label: 'Attributions' },
    ],
  }
);
