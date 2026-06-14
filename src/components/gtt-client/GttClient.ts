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
import { GttEventBus, GttEvent } from './events';

/**
 * GttClient is a class representing a geospatial application client.
 * It initializes and manages map instances, map-related settings,
 * layers, controls, and event listeners.
 */
export default class GttClient {
  // The definite-assignment assertions cover the early constructor
  // return for a missing target; with a target everything is assigned
  // by the constructor and the init helpers it calls.
  readonly map!: Map;
  maps!: Array<Map>;
  defaults!: DOMStringMap;
  contents!: DOMStringMap;
  i18n: any;
  filters!: IFilterOption;
  vector!: VectorLayer<VectorSource<Feature<Geometry>>>;
  bounds!: VectorLayer<VectorSource<Feature<Geometry>>>;
  geolocations!: Array<Geolocation>;
  // True once the user moved the map (drag, scroll zoom, control buttons);
  // programmatic view changes don't set it. See trackUserMapInteraction.
  userMovedMap!: boolean;
  // Typed pub/sub for lifecycle and interaction events. Sibling plugins
  // without a client reference can subscribe via the bubbling DOM
  // CustomEvents the bus dispatches (see GttEventBus).
  readonly events!: GttEventBus;

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
    if (!this.defaults.i18n) {
      // Fail fast: without the #gtt-defaults i18n payload every later
      // this.i18n access would crash with a far less actionable error.
      throw new Error('[GTT] Missing i18n data on the #gtt-defaults element');
    }
    this.i18n = JSON.parse(this.defaults.i18n);

    // Initialize map, layers, controls, and event listeners
    this.map = initMap(target, this.i18n);
    // The bus dispatches DOM CustomEvents on the map element; create it
    // before the init steps so they (and their event emissions) have it.
    this.events = new GttEventBus(this.map.getTargetElement() as HTMLElement);
    initLayers.call(this);
    this.events.emit(GttEvent.LayersReady, {
      client: this,
      map: this.map,
      layers: this.map.getLayers().getArray() as any,
    });
    initControls.call(this);
    initEventListeners.call(this);

    // Add the initialized map to the maps array
    this.maps.push(this.map);

    // The map is fully constructed. Subscribers that hold the client
    // reference already see a ready map; this event is primarily for
    // document-level DOM listeners registered before the map attached.
    this.events.emit(GttEvent.MapReady, {
      client: this,
      map: this.map,
      target,
    });
  }
}
