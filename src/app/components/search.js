import 'ol-ext/control/Search.css';

import map from "./map";

import SearchControl from 'ol-ext/control/Search';

const search = new SearchControl();

search.on('select', function (e) {
  // console.log(e);
});

map.addControl(search);

export default search;
