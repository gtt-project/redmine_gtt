import { Feature } from 'ol';
import { FeatureLike } from 'ol/Feature';
import { Geometry } from 'ol/geom';
import { Style, Fill, Stroke } from 'ol/style';

import { markerIcon, SvgGlyph } from './marker';

// Fallback glyph (MDI 'home'): used when a tracker has no icon configured
// or still carries a legacy icon-font glyph name.
const DEFAULT_GLYPH: SvgGlyph = {
  viewBox: '0 0 24 24',
  body: '<path d="M10,20V14H14V20H19V12H22L12,3L2,12H5V20H10Z"/>',
};

// Tracker icon settings hold JSON {id, svg} (see RedmineGtt::TrackerIcon).
// Parsed glyphs are cached by their raw setting value.
const glyphCache = new Map<string, SvgGlyph | null>();

function parseGlyph(value: string): SvgGlyph | null {
  if (glyphCache.has(value)) {
    return glyphCache.get(value) ?? null;
  }
  let glyph: SvgGlyph | null = null;
  try {
    const data = JSON.parse(value);
    if (data && typeof data.svg === 'string') {
      const root = new DOMParser()
        .parseFromString(data.svg, 'image/svg+xml')
        .documentElement;
      if (root && root.nodeName.toLowerCase() === 'svg') {
        glyph = {
          viewBox: root.getAttribute('viewBox') || '0 0 24 24',
          body: root.innerHTML,
        };
      }
    }
  } catch {
    // Legacy glyph names (icon-font era) and malformed values fall through
    // to the default glyph.
  }
  glyphCache.set(value, glyph);
  return glyph;
}

function glyphForFeature(mapObj: any, feature: Feature<Geometry>): SvgGlyph {
  const value = getSymbol(mapObj, feature);
  return (value && parseGlyph(value)) || DEFAULT_GLYPH;
}

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
      glyph: glyphForFeature(mapObj, feature),
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
 * Matches OpenLayers' StyleFunction signature so it can be bound and
 * passed to a vector layer directly.
 *
 * @param {FeatureLike} feature - The map feature for which the styles are being generated.
 * @param {number} _resolution - Unused view resolution.
 * @returns {Style[]} - An array of styles to be applied on the feature.
 */
export function getStyle(this: any, feature: FeatureLike, _resolution: number): Style[] {
  return [applyMarkerStyle(this, feature as Feature<Geometry>)];
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

  let color = feature.getGeometry()?.getType() !== 'Point' ? LINE_AND_POLYGON_COLOR : DEFAULT_COLOR;
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
