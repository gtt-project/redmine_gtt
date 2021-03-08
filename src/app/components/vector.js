import map from "./map";

import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";

let vector = new VectorLayer({
  source: new VectorSource()
})

map.addLayer(vector);

export default vector;
