/**
 * GTT Settings Management
 *
 * This module handles the initialization and configuration of the GTT settings
 * interface, including applying custom behavior to select menus and processing
 * tracker elements.
 */

// Import OpenLayers core CSS for default styling
import 'ol/ol.css';

// Import OpenLayers extended CSS for additional components and styling
import 'ol-ext/dist/ol-ext.min.css';

// Import the function to override the select menu behavior
import { overrideSelectMenu } from './selectMenuOverride';

// Import the function to process tracker elements
import { processElement } from './processElement';

/**
 * Initializes the GTT settings interface and applies necessary configurations.
 * Overrides the default behavior of HTML select menus and processes tracker elements.
 *
 * @function gtt_setting
 * @returns {void}
 */
export const gtt_setting = (): void => {
  // Call the overrideSelectMenu function to override the default behavior of the HTML select menu
  overrideSelectMenu();

  // Get all tracker elements with an ID starting with "settings_tracker_"
  const trackerElements = document.querySelectorAll("[id^='settings_tracker_']");

  // Call processElement function on each of the tracker elements to apply necessary changes
  trackerElements.forEach(processElement);
};
