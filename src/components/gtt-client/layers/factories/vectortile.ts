// src/components/gtt-client/layers/factories/vectortile.ts
import VectorTileLayer from 'ol/layer/VectorTile';
import VectorTileSource from 'ol/source/VectorTile';
import MVT from 'ol/format/MVT';
import { applyStyle, applyBackground } from 'ol-mapbox-style';

import { registerLayerFactory } from '../registry';

/**
 * Named "vectortile" layer type: Mapbox Vector Tiles (MVT), either from a
 * tile URL template, a Mapbox/MapLibre style document URL, or both. When only
 * a style URL is given, ol-mapbox-style creates and populates the source from
 * the style document.
 */
registerLayerFactory(
  'vectortile',
  (config) => {
    const options = (config.layer_options ?? {}) as any;
    if (!options.url && !options.styleUrl) {
      throw new Error('vectortile layer requires a "url" or "styleUrl" option');
    }

    const layer = new VectorTileLayer({
      visible: false,
      declutter: options.declutter ?? true,
    });

    if (options.url) {
      layer.setSource(
        new VectorTileSource({
          format: new MVT(),
          url: options.url,
          attributions: options.attributions,
          maxZoom: options.maxZoom,
          minZoom: options.minZoom,
        })
      );
    }

    if (options.styleUrl) {
      applyStyle(layer, options.styleUrl);
      applyBackground(layer, options.styleUrl);
    }

    return layer;
  },
  {
    type: 'vectortile',
    label: 'Vector tiles (MVT)',
    options: [
      {
        name: 'styleUrl',
        type: 'url',
        label: 'Style URL',
        help: 'Mapbox/MapLibre style JSON, e.g. https://tile.openstreetmap.jp/styles/osm-bright-ja/style.json',
      },
      {
        name: 'url',
        type: 'url',
        label: 'Tile URL template',
        help: 'Optional when a style URL is given, e.g. https://example.com/tiles/{z}/{x}/{y}.pbf',
      },
      { name: 'attributions', type: 'string', label: 'Attributions' },
      { name: 'declutter', type: 'boolean', label: 'Declutter labels', default: true },
      {
        name: 'maxZoom',
        type: 'number',
        label: 'Max tile zoom',
        help: 'Highest zoom level tiles are available at; the map overzooms beyond it',
      },
      {
        name: 'minZoom',
        type: 'number',
        label: 'Min tile zoom',
        help: 'Lowest zoom level tiles are available at',
      },
    ],
  }
);
