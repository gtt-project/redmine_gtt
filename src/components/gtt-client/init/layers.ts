import { Feature } from 'ol';
import * as olSource from 'ol/source';
import { Layer, Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import { GeoJSON } from 'ol/format';
import { Geometry } from 'ol/geom';
import { Style, Fill, Stroke } from 'ol/style';
import { OrderFunction } from 'ol/render';

import Ordering from 'ol-ext/render/Ordering';
import Mask from 'ol-ext/filter/Mask';

import { ILayerObject } from '../interfaces';
import { updateForm } from "../helpers";
import { setBasemap } from "../openlayers";
import { getStyle } from "../openlayers/styles";
import { createLayer } from '../layers/registry';
// Side-effect import: registers all built-in layer factories.
import '../layers/factories';

/**
 * Initializes layers for the OpenLayers map and adds them to the layerArray.
 * @returns {Layer[] | undefined} Array of layers added to the map.
 */
export function initLayers(this: any): Layer[] | undefined {
  this.layerArray = [];

  const features = readGeoJSONFeatures.call(this);
  // Hydration, not a user edit: write existing geometry into the form field
  // without emitting geometry:change (which would fire before map:ready).
  updateForm(this, features, false, false);

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
    const features = new GeoJSON().readFeatures(
      JSON.parse(this.contents.geom), {
        featureProjection: 'EPSG:3857'
      }
    );

    // Filter out non-standard features and cast the rest to Feature<Geometry>
    return features.filter(feature => feature instanceof Feature) as Feature<Geometry>[];
  }
  return null;
}

/**
 * Creates layers based on the input data and adds them to the layerArray.
 * Construction is delegated to the layer factory registry; configurations
 * that cannot be built are skipped (the registry logs them) so one broken
 * layer does not take down the whole map.
 */
function createLayers(this: any): void {
  const layers = JSON.parse(this.contents.layers) as ILayerObject[];
  layers.forEach((config) => {
    const layer = createLayer(config);

    if (layer) {
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
  let hasOverlay = false;

  this.layerArray.forEach((l: Layer) => {
    if (l.get("baseLayer")) {
      this.map.addLayer(l);
    } else {
      this.map.addLayer(l);
      hasOverlay = true;
    }
  });

  this.containsOverlay = hasOverlay;
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
  this.map.addLayer(this.bounds);
}

/**
 * Adds a vector layer to the map for rendering GeoJSON features.
 * @param {Feature<Geometry>[] | null} features - Array of GeoJSON features or null if no features found.
 */
function addVectorLayer(this: any, features: Feature<Geometry>[] | null): void {
  const yOrdering: unknown = Ordering.yOrdering();

  // Initialize the VectorSource with the appropriate type and options
  const vectorSource = new VectorSource<Feature<Geometry>>({
    useSpatialIndex: false
  });

  // Add features to the source if they are not null
  if (features !== null) {
    vectorSource.addFeatures(features);
  }

  this.vector = new VectorLayer({
    source: vectorSource,
    renderOrder: yOrdering as OrderFunction,
    style: getStyle.bind(this),
    minZoom: this.defaults.vectorMinzoom || 0
  });

  this.vector.set('title', 'Features');
  this.vector.set('displayInLayerSwitcher', false);
  // this.vector.on('prerender', () => this.map.flushDeclutterItems());

  // Listen to the moveend event and show message when zoom level is too low
  let previousZoom = this.map.getView().getZoom();

  const notification = document.createElement('div');
  notification.className = 'gtt-map-notification';
  notification.innerText = this.i18n.messages.zoom_in_more;

  const mapContainer = this.map.getTargetElement();
  Object.assign(mapContainer.style, {
    position: 'relative',
  });

  this.map.on('moveend', () => {
    const currentZoom = this.map.getView().getZoom();
    if (previousZoom !== currentZoom) {
      if (currentZoom <= Number(this.defaults.vectorMinzoom || 0)) {
        mapContainer.appendChild(notification);
      }
      else {
        try {
          mapContainer.removeChild(notification);
        } catch (error) {}
      }
      previousZoom = currentZoom;
    }
  });

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
    ) as Feature<Geometry>;

    this.bounds.getSource().addFeature(boundary);
    if (this.contents.bounds === this.contents.geom) {
      this.vector.setVisible(false);
    }
    this.layerArray.forEach((layer: Layer) => {
      if (layer.get('baseLayer')) {
        if (layer.getRenderSource() instanceof olSource.Google) {
          // currently Google source does not seem to support filters
        }
        else {
          layer.addFilter(new Mask({
            feature: boundary,
            inner: false,
            fill: new Fill({
              color: [220, 26, 26, 0.1]
            })
          }));
        }
      }
    });
  }
}
