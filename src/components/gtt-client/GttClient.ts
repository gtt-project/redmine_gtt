import { Map, Geolocation } from 'ol';
import { Geometry } from 'ol/geom';
import { Layer, Vector as VectorLayer  } from 'ol/layer';
import { Vector as VectorSource } from 'ol/source';
import Bar from 'ol-ext/control/Bar';

import { IGttClientOption, IFilterOption } from './interfaces';

import { initDefaults } from './init/defaults';
import { initContents } from './init/contents';
import { initMap } from './init/map';
import { initLayers } from './init/layers';
import { initControls } from './init/controls';
import { initEventListeners } from './init/events';

export default class GttClient {
  readonly map: Map;
  maps: Array<Map>;
  layerArray: Layer[];
  defaults: DOMStringMap;
  contents: DOMStringMap;
  i18n: any;
  toolbar: Bar;
  filters: IFilterOption;
  vector: VectorLayer<VectorSource<Geometry>>;
  bounds: VectorLayer<VectorSource<Geometry>>;
  geolocations: Array<Geolocation>;

  constructor(options: IGttClientOption) {
    if (!options.target) {
      return;
    }

    // For map div focus settings
    if (options.target) {
      if (options.target.getAttribute('tabindex') == null) {
        options.target.setAttribute('tabindex', '0')
      }
    }

    this.filters = {
      location: false,
      distance: false,
    };
    this.maps = [];
    this.geolocations = [];

    this.defaults = initDefaults();
    this.contents = initContents(options.target);
    this.i18n = JSON.parse(this.defaults.i18n);

    this.map = initMap(options.target, this.i18n);

    this.layerArray = initLayers.call(this);

    initControls.call(this);

    initEventListeners.call(this);

    // Handle multiple maps per page
    this.maps.push(this.map)
  }
}
