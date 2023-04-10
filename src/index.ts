// Import stylesheets
// OpenLayers core stylesheet
import 'ol/ol.css';

// OpenLayers extensions stylesheet
import 'ol-ext/dist/ol-ext.min.css';

// Custom app styles
import './stylesheets/app.scss';

// Custom icons
import './stylesheets/custom-icons.css';
import './stylesheets/custom-icons-def.js';

// Material Design icons
import '@material-design-icons/font/filled.css';
import './stylesheets/material-design-def.js';

// Import components
import { GttClient } from './components/gtt-client';
import { gtt_setting } from './components/gtt-setting';

// Define functions to attach to the global window object

/**
 * Creates a GttClient instance for the given target.
 * @param target - The HTMLDivElement for which the GttClient will be created.
 */
function createGttClient(target: HTMLDivElement) {
  new GttClient({ target });
}

/**
 * Attaches GTT settings.
 */
function attachGttSetting() {
  gtt_setting();
}

// Attach functions to global window object
window.createGttClient = createGttClient;
window.gtt_setting = attachGttSetting;
