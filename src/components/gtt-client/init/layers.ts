import { Feature } from 'ol';
import { Layer, Tile, Image, Vector as VectorLayer, VectorTile as VTLayer } from 'ol/layer';
import { Vector as VectorSource, Image as ImageSource, Tile as TileSource } from 'ol/source';
import { GeoJSON, MVT } from 'ol/format';
import { Geometry } from 'ol/geom';
import { Options as ImageWMSOptions } from 'ol/source/ImageWMS';
import { Options as VectorTileOptions } from 'ol/source/VectorTile';
import { Style, Fill, Stroke } from 'ol/style';
import { OrderFunction } from 'ol/render';

import Ordering from 'ol-ext/render/Ordering';
import Mask from 'ol-ext/filter/Mask';
import { applyStyle } from 'ol-mapbox-style';

import { ILayerObject, ITileLayerSource, IImageLayerSource, IVTLayerSource } from '../interfaces';
import { updateForm, reloadFontSymbol } from "../helpers";
import { getLayerSource, setBasemap, getStyle } from "../openlayers";

export function initLayers(this: any): Layer[] {
  this.layerArray = [];

  const features = readGeoJSONFeatures.call(this);
  reloadFontSymbol.call(this);
  updateForm(this, features);

  if (this.contents.layers) {
    createLayers.call(this);
    addLayersToMap.call(this);
  }

  setBasemap.call(this);
  addBoundsLayer.call(this);
  addVectorLayer.call(this, features);
  renderProjectBoundary.call(this);

  return this.layerArray;
}

function readGeoJSONFeatures(this: any): Feature<Geometry>[] | null {
  if (this.contents.geom && this.contents.geom !== null && this.contents.geom !== 'null') {
    return new GeoJSON().readFeatures(
      JSON.parse(this.contents.geom), {
        featureProjection: 'EPSG:3857'
      }
    );
  }
  return null;
}

function createLayers(this: any): void {
  const layers = JSON.parse(this.contents.layers) as [ILayerObject];
  layers.forEach((layer) => {
    const s = layer.type.split('.');
    const layerSource = getLayerSource(s[1], s[2]);
    const l = createLayer(layer, layerSource);

    if (l) {
      setLayerProperties(l, layer);
      handleLayerVisibilityChange(l, layer);
      this.layerArray.push(l);
    }
  }, this);
}

function createLayer(layer: ILayerObject, layerSource: ITileLayerSource | IImageLayerSource | IVTLayerSource): Layer | null {
  switch (layerSource.type) {
    case "TileLayerSource":
      return createTileLayer(layer, layerSource as ITileLayerSource);
    case "ImageLayerSource":
      return createImageLayer(layer, layerSource as IImageLayerSource);
    case "VTLayerSource":
      return createVTLayer(layer, layerSource as IVTLayerSource);
    default:
      return null;
  }
}

function createTileLayer(layer: ILayerObject, config: ITileLayerSource): Tile<TileSource> {
  return new (config.layer)({
    visible: false,
    source: new (config.source)(layer.options as any)
  });
}

function createImageLayer(layer: ILayerObject, config: IImageLayerSource): Image<ImageSource> {
  return new (config.layer)({
    visible: false,
    source: new (config.source)(layer.options as ImageWMSOptions)
  });
}

function createVTLayer(layer: ILayerObject, config: IVTLayerSource): VTLayer {
  const options = layer.options as VectorTileOptions;
  options.format = new MVT();
  const l = new (config.layer)({
    visible: false,
    source: new (config.source)(options),
    declutter: true
  }) as VTLayer;

  // Apply style URL if provided
  if ("styleUrl" in options) {
    applyStyle(l, options.styleUrl);
  }

  return l;
}

function setLayerProperties(layer: Layer, layerObject: ILayerObject): void {
  layer.set('lid', layerObject.id);
  layer.set('title', layerObject.name);
  layer.set('baseLayer', layerObject.baselayer);
}

function handleLayerVisibilityChange(layer: Layer, layerObject: ILayerObject): void {
  if (layerObject.baselayer) {
    layer.on('change:visible', e => {
      const target = e.target as Layer;
      if (target.getVisible()) {
        const lid = target.get('lid');
        document.cookie = `_redmine_gtt_basemap=${lid};path=/`;
      }
    });
  }
}

function addLayersToMap(this: any): void {
  this.layerArray.forEach((l: Layer) => {
    if (l.get("baseLayer")) {
      this.map.addLayer(l);
    }
  });

  this.containsOverlay = false;

  this.layerArray.forEach((l: Layer) => {
    if (!l.get("baseLayer")) {
      this.map.addLayer(l);
      this.containsOverlay = true;
    }
  });
}

function addBoundsLayer(this: any): void {
  this.bounds = new VectorLayer({
    source: new VectorSource(),
    style: new Style({
      fill: new Fill({
        color: 'rgba(255,255,255,0.0)'
      }),
      stroke: new Stroke({
        color: 'rgba(220,26,26,0.7)',
        width: 1
      })
    })
  });
  this.bounds.set('title', 'Boundaries');
  this.bounds.set('displayInLayerSwitcher', false);
  this.layerArray.push(this.bounds);
  this.map.addLayer(this.bounds);
}

function addVectorLayer(this: any, features: Feature<Geometry>[] | null): void {
  const yOrdering: unknown = Ordering.yOrdering();
  this.vector = new VectorLayer<VectorSource<Geometry>>({
    source: new VectorSource({
      'features': features,
      'useSpatialIndex': false
    }),
    renderOrder: yOrdering as OrderFunction,
    style: getStyle.bind(this)
  });
  this.vector.set('title', 'Features');
  this.vector.set('displayInLayerSwitcher', false);
  this.layerArray.push(this.vector);
  this.map.addLayer(this.vector);
}

function renderProjectBoundary(this: any): void {
  if (this.contents.bounds && this.contents.bounds !== null) {
    const boundary = new GeoJSON().readFeature(
      this.contents.bounds, {
        featureProjection: 'EPSG:3857'
      }
    );
    this.bounds.getSource().addFeature(boundary);
    if (this.contents.bounds === this.contents.geom) {
      this.vector.setVisible(false);
    }
    this.layerArray.forEach((layer: Layer) => {
      if (layer.get('baseLayer')) {
        layer.addFilter(new Mask({
          feature: boundary,
          inner: false,
          fill: new Fill({
            color: [220, 26, 26, 0.1]
          })
        }));
      }
    });
  }
}
