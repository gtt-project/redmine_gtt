import 'ol-ext/control/Bar.css';

import map from "./map";
import vector from "./vector";

import Draw from 'ol/interaction/Draw';
import Select from 'ol/interaction/Select';

import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';

import Rotate from 'ol/control/Rotate';
import FullScreen from 'ol/control/FullScreen';
import ZoomToExtent from 'ol/control/ZoomToExtent';

// Main control bar
let toolbar = new Bar();
map.addControl(toolbar);
toolbar.setPosition('left');

/* Nested toobar with one control activated at once */
let nested = new Bar ({
  toggleOne: true,
  group: true
});
toolbar.addControl(nested);

// Add selection tool (a toggle control with a select interaction)
let selectCtrl = new Toggle({
  html: 'S',
  title: "Select",
  interaction: new Select(),
  active: true,
  onToggle: function(active) {
    console.log(active?"activated":"deactivated")
  }
});
nested.addControl(selectCtrl);

// Add editing tools
let pedit = new Toggle({
  html: 'D',
  title: 'Point',
  interaction: new Draw({
    type: 'Point',
    source: vector.getSource()
  }),
  onToggle: function(active) {
    console.log(active?"activated":"deactivated")
  }
});
nested.addControl( pedit );

/* Standard Controls */
toolbar.addControl(
  new ZoomToExtent({
    extent: [ 265971, 6243397, 273148, 6250665 ]
  })
);
toolbar.addControl(
  new Rotate()
);
toolbar.addControl(
  new FullScreen()
);

export default toolbar;
