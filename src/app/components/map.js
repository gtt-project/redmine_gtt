import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';

import * as Proj from 'ol/proj';

let basemap = new TileLayer({
  source: new OSM()
});

const map = new Map({
  target: 'map',
  layers: [basemap],
  view: new View({
    center: new Proj.fromLonLat([140, 35]),
    zoom: 5
  })
});

export default map;
