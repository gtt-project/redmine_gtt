import { Feature } from 'ol';
import * as olLayer from 'ol/layer';
import * as olSource from 'ol/source';
import * as olFormat from 'ol/format';
import { Layer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Geometry } from 'ol/geom';
import { Style, Fill, Stroke } from 'ol/style';
import { OrderFunction } from 'ol/render';

import Ordering from 'ol-ext/render/Ordering';
import Mask from 'ol-ext/filter/Mask';
import { applyStyle } from 'ol-mapbox-style';

import { ILayerObject } from '../interfaces';
import { updateForm, reloadFontSymbol } from "../helpers";
import { setBasemap, getStyle } from "../openlayers";

/**
 * Initializes layers for the OpenLayers map and adds them to the layerArray.
 * @returns {Layer[]} Array of layers added to the map.
 */
export function initLayers(this: any): Layer[] {
  this.layerArray = [];

  const features = readGeoJSONFeatures.call(this);
  reloadFontSymbol.call(this);
  updateForm(this, features);

  if (this.contents.layers) {
    createLayers.call(this);
    addLayersToMap.call(this);
  }
  else {
    return;
  }

  setBasemap.call(this);
  addBoundsLayer.call(this);
  addVectorLayer.call(this, features);
  renderProjectBoundary.call(this);

  return this.layerArray;
}

/**
 * Reads GeoJSON features from the provided input.
 * @returns {Feature<Geometry>[] | null} Array of GeoJSON features or null if no features found.
 */
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

/**
 * Creates layers based on the input data and adds them to the layerArray.
 */
function createLayers(this: any): void {
  const layers = JSON.parse(this.contents.layers) as [ILayerObject];
  layers.forEach((config) => {

    const LayerClass = olLayer[config.layer as keyof typeof olLayer] as typeof olLayer.Layer;
    const layerOptions = config.layer_options as any;
    layerOptions['visible'] = false;

    if (config.source) {
      const SourceClass = olSource[config.source as keyof typeof olSource] as typeof olSource.Source;
      const sourceOptions = config.source_options;
      layerOptions['source'] = new SourceClass(sourceOptions);
    }

    if (config.format) {
      const FormatClass = olFormat[config.format as keyof typeof olFormat] as any;
      const formatOptions = config.format_options;
      layerOptions['format'] = new FormatClass(formatOptions);
    }

    const layer = new LayerClass(layerOptions);

    if (layer) {
      // Apply style URL if provided
      if ("styleUrl" in layerOptions) {
        applyStyle(layer as any, layerOptions.styleUrl);
      }

      setLayerProperties(layer, config);
      handleLayerVisibilityChange(layer, config);
      this.layerArray.push(layer);
    }
  }, this);
}

/**
 * Sets properties for a layer based on the input layer object.
 * @param {Layer} layer - Layer object.
 * @param {ILayerObject} layerObject - Input layer object data.
 */
function setLayerProperties(layer: Layer, layerObject: ILayerObject): void {
  layer.set('lid', layerObject.id);
  layer.set('title', layerObject.name);
  layer.set('baseLayer', layerObject.baselayer);
}

/**
 * Handles visibility change for a layer and updates the cookie accordingly.
 * @param {Layer} layer - Layer object.
 * @param {ILayerObject} layerObject - Input layer object data.
 */
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

/**
 * Adds layers to the map based on their properties.
 */
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

/**
 * Adds a bounds layer to the map for rendering boundaries.
 */
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

/**
 * Adds a vector layer to the map for rendering GeoJSON features.
 * @param {Feature<Geometry>[] | null} features - Array of GeoJSON features or null if no features found.
 */
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

/**
 * Renders the project boundary on the map by adding a boundary feature and applying a mask to the base layers.
 */
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
