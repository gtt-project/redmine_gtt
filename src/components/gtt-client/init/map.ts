import { Map } from 'ol';
import { defaults as interactionsDefaults, MouseWheelZoom } from 'ol/interaction';
import { focus as eventsConditionFocus } from 'ol/events/condition';
import { defaults as controlDefaults } from 'ol/control';

/**
 * Initializes a new OpenLayers Map instance with custom interactions and controls.
 * @param target - The HTMLElement where the map will be rendered.
 * @param i18n - An object containing translations for user interface elements.
 * @returns - The initialized OpenLayers Map instance.
 */
export function initMap(target: HTMLElement, i18n: any): Map {
  // Define custom interactions
  const interactions = interactionsDefaults({ mouseWheelZoom: false }).extend([
    new MouseWheelZoom({
      constrainResolution: true, // force zooming to an integer zoom
      condition: eventsConditionFocus, // only wheel/trackpad zoom when the map has the focus
    }),
  ]);

  // Define custom controls
  const controls = controlDefaults({
    rotateOptions: {},
    attributionOptions: {
      collapsible: false,
    },
    zoomOptions: {
      zoomInTipLabel: i18n.control.zoom_in,
      zoomOutTipLabel: i18n.control.zoom_out,
    },
  });

  // Initialize the map with custom interactions and controls
  const map = new Map({
    target,
    interactions,
    controls,
  });

  return map;
}
