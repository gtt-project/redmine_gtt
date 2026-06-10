import { Feature } from 'ol';
import { Geometry } from 'ol/geom';
import { Style, Fill, Stroke } from 'ol/style';

import { markerIcon, SvgGlyph } from './marker';

// Spike glyph: MDI 'home'. The per-tracker SVG lookup arrives with the
// settings storage; until then every point renders this glyph.
const DEFAULT_GLYPH: SvgGlyph = {
  viewBox: '0 0 24 24',
  body: '<path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>',
};

/**
 * Creates the marker style for a given feature: an SVG badge with the
 * tracker glyph, anchored at the feature position, plus stroke/fill for
 * non-point geometries.
 *
 * @param {any} mapObj - The map object containing default settings.
 * @param {Feature<Geometry>} feature - The map feature for which the style is being generated.
 * @returns {Style} - The marker style.
 */
function applyMarkerStyle(mapObj: any, feature: Feature<Geometry>): Style {
  return new Style({
    image: markerIcon({
      glyph: DEFAULT_GLYPH,
      fill: getColor(mapObj, feature),
      stroke: '#333333',
      glyphColor: getFontColor(),
    }),
    stroke: new Stroke({
      width: 4,
      color: getColor(mapObj, feature),
    }),
    fill: new Fill({
      color: getColor(mapObj, feature, true),
    }),
  });
}

/**
 * Get an array of styles to be applied to a given feature.
 *
 * @param {Feature<Geometry>} feature - The map feature for which the styles are being generated.
 * @param {unknown} _ - Unused parameter.
 * @returns {Style[]} - An array of styles to be applied on the feature.
 */
export function getStyle(feature: Feature<Geometry>, _: unknown): Style[] {
  return [applyMarkerStyle(this, feature)];
}

/**
 * Get color for a map feature based on its geometry type and status.
 * The default color is applied if no specific settings are found.
 *
 * @param {any} mapObj - The map object containing default settings.
 * @param {Feature<Geometry>} feature - The map feature to get color for.
 * @param {boolean} isFill - Determines if the color should include an alpha value. Default is false.
 * @returns {string} - The calculated color value in hexadecimal format (with optional alpha).
 */
export function getColor(mapObj: any, feature: Feature<Geometry>, isFill: boolean = false): string {
  const DEFAULT_COLOR = '#000000';
  const LINE_AND_POLYGON_COLOR = '#FFD700';

  let color = feature.getGeometry().getType() !== 'Point' ? LINE_AND_POLYGON_COLOR : DEFAULT_COLOR;
  const pluginSettings = JSON.parse(mapObj.defaults.pluginSettings);
  const statusInput = document.querySelector('#issue_status_id') as HTMLInputElement;

  let statusId = feature.get('status_id') || (statusInput && statusInput.value);

  if (statusId) {
    const key = `status_${statusId}`;
    if (key in pluginSettings) {
      color = pluginSettings[key];
    }
  }

  if (isFill && color.length === 7) {
    color = color + '33'; // Add alpha: 0.2
  }

  return color;
}

/**
 * Get the default font color.
 *
 * @returns {string} - The default font color in hexadecimal format (#FFFFFF).
 */
export function getFontColor(): string {
  const DEFAULT_FONT_COLOR = "#FFFFFF";
  return DEFAULT_FONT_COLOR;
}

/**
 * Get the appropriate symbol based on tracker ID present in mapObj or feature.
 *
 * @param {any} mapObj - The map object containing default settings.
 * @param {Feature<Geometry>} feature - The map feature for which we are getting the symbol.
 * @returns {string} - The symbol name.
 */
export function getSymbol(mapObj: any, feature: Feature<Geometry>): string {
  let symbol = 'home';

  const pluginSettings = JSON.parse(mapObj.defaults.pluginSettings);
  const issueTracker = document.querySelector('#issue_tracker_id') as HTMLInputElement;

  let trackerId = feature.get('tracker_id') || (issueTracker && issueTracker.value);

  if (trackerId) {
    const key = `tracker_${trackerId}`;

    if (key in pluginSettings) {
      symbol = pluginSettings[key];
    }
  }

  return symbol;
}
