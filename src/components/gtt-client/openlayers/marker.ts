import { Icon } from 'ol/style';

/**
 * SVG marker composition for tracker icons.
 *
 * Markers are composed as standalone SVGs (badge + glyph + ground shadow)
 * and rendered through OpenLayers' native Icon style. This replaces the
 * ol-ext FontSymbol/Shadow pair and works with any SVG glyph, so tracker
 * icons no longer require an icon font.
 */

/** An SVG glyph: the inner markup of an icon, with its viewBox. */
export interface SvgGlyph {
  viewBox: string;
  body: string;
}

export interface MarkerStyleOptions {
  glyph: SvgGlyph | null;
  /** Badge background color (status color). */
  fill: string;
  /** Badge outline color. */
  stroke: string;
  /** Glyph color. */
  glyphColor: string;
}

// Badge geometry: rounded square with a pointer tail; the tail tip sits at
// the bottom center, which is the icon anchor (the feature position).
const WIDTH = 36;
const HEIGHT = 46;
const BADGE_PATH =
  'M8 1.5 h20 a6.5 6.5 0 0 1 6.5 6.5 v20 a6.5 6.5 0 0 1 -6.5 6.5 h-4.5 ' +
  'L18 42 l-5.5 -7.5 H8 a6.5 6.5 0 0 1 -6.5 -6.5 v-20 a6.5 6.5 0 0 1 6.5 -6.5 z';

function glyphMarkup(glyph: SvgGlyph | null, color: string): string {
  if (!glyph) {
    return '';
  }
  // Fit the glyph into a 22x22 box centered in the 36x36 badge body.
  const [, , w, h] = glyph.viewBox.split(/\s+/).map(Number);
  const scale = 22 / Math.max(w || 24, h || 24);
  return `<g transform="translate(7 6.5) scale(${scale})" fill="${color}">${glyph.body}</g>`;
}

export function markerSvg(options: MarkerStyleOptions): string {
  // Drawn at 2x intrinsic size so OpenLayers rasterizes it crisply on
  // high-dpi displays (paired with scale 0.5 on the Icon).
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${WIDTH * 2}" height="${HEIGHT * 2}" viewBox="0 0 ${WIDTH} ${HEIGHT}">` +
    `<ellipse cx="18" cy="42.5" rx="9" ry="2.8" fill="rgba(0,0,0,0.35)"/>` +
    `<path d="${BADGE_PATH}" fill="${options.fill}" stroke="${options.stroke}" stroke-width="1"/>` +
    glyphMarkup(options.glyph, options.glyphColor) +
    `</svg>`;
}

/**
 * Builds the OpenLayers Icon image for a marker. Anchored at the tail tip.
 */
export function markerIcon(options: MarkerStyleOptions): Icon {
  return new Icon({
    src: `data:image/svg+xml,${encodeURIComponent(markerSvg(options))}`,
    anchor: [0.5, 1],
    scale: 0.5,
  });
}
