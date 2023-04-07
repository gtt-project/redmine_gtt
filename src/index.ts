// Import stylesheets
import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.min.css';
import './stylesheets/app.scss';
import './stylesheets/custom-icons.css';
import './stylesheets/custom-icons-def.js';
import '@material-design-icons/font/filled.css';
import './stylesheets/material-design-def.js';

// Import components
import { GttClient } from './components/gtt-client';
import { gtt_setting } from './components/gtt-setting';

// Define functions to attach to the global window object
function createGttClient(target: HTMLDivElement) {
  new GttClient({ target });
}

function attachGttSetting() {
  gtt_setting();
}

// Attach functions to global window object
window.createGttClient = createGttClient;
window.gtt_setting = attachGttSetting;
