import { Map, Geolocation } from 'ol';
import { Geometry } from 'ol/geom';
import { Vector as VectorLayer } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Feature from 'ol/Feature';

import { IGttClientOption, IFilterOption } from './interfaces';

import { initDefaults, initFilters } from './init/defaults';
import { initContents, setTabIndex } from './init/contents';
import { initMap } from './init/map';
import { initLayers } from './init/layers';
import { initControls } from './init/controls';
import { initEventListeners } from './init/events';

/**
 * GttClient is a class representing a geospatial application client.
 * It initializes and manages map instances, map-related settings,
 * layers, controls, and event listeners.
 */
export default class GttClient {
  readonly map: Map;
  maps: Array<Map>;
  defaults: DOMStringMap;
  contents: DOMStringMap;
  i18n: any;
  filters: IFilterOption;
  vector: VectorLayer<VectorSource<Feature<Geometry>>>;
  bounds: VectorLayer<VectorSource<Feature<Geometry>>>;
  geolocations: Array<Geolocation>;

  /**
   * Constructs a new GttClient instance.
   * @param target - The HTMLElement where the map will be rendered.
   */
  constructor({ target }: IGttClientOption) {
    if (!target) return;

    // Set tabindex for map div focus settings
    setTabIndex(target);

    // Initialize class properties
    this.maps = [];
    this.geolocations = [];
    this.defaults = initDefaults();
    this.filters = initFilters();
    this.contents = initContents(target);
    this.i18n = JSON.parse(this.defaults.i18n);

    // Initialize map, layers, controls, and event listeners
    this.map = initMap(target, this.i18n);
    initLayers.call(this);
    initControls.call(this);
    initEventListeners.call(this);

    // Add the initialized map to the maps array
    this.maps.push(this.map);
  }
}
