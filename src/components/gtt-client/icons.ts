import {
  mdiArrowExpandAll,
  mdiArrowRightCircleOutline,
  mdiCrosshairsGps,
  mdiDelete,
  mdiFileUpload,
  mdiMapMarkerOutline,
  mdiMapMarkerQuestionOutline,
  mdiMapSearchOutline,
  mdiPencil,
  mdiVectorPolygon,
  mdiVectorPolyline,
} from '@mdi/js';

/**
 * Control button icons as inline SVG (path data from @mdi/js, tree-shaken
 * to just the icons listed here). Replaces the @mdi/font icon font, which
 * shipped 7000+ glyphs as webfonts for the handful of buttons below.
 */

export const icons = {
  search: mdiMapSearchOutline,
  reverseSearch: mdiMapMarkerQuestionOutline,
  maximize: mdiArrowExpandAll,
  drawPoint: mdiMapMarkerOutline,
  drawLine: mdiVectorPolyline,
  drawPolygon: mdiVectorPolygon,
  edit: mdiPencil,
  remove: mdiDelete,
  upload: mdiFileUpload,
  popupLink: mdiArrowRightCircleOutline,
  geolocate: mdiCrosshairsGps,
} as const;

/** Inline SVG markup for a control button. Inherits the button color. */
export function buttonIcon(path: string): string {
  return `<svg class="gtt-button-icon" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="${path}"/></svg>`;
}
