/**
 * OpenLayers map behaviour, split by concern:
 *
 * - view: initial view + zoom-to-extent
 * - basemap: baselayer selection
 * - edit: draw/modify/clear controls, measure tooltip, snapping
 * - upload-dialog: GeoJSON upload via the native <dialog>
 * - popover: feature popup on read-only maps
 * - geolocation: position tracking control
 * - zcoords: z-coordinate preservation while editing in 2D
 * - styles / marker: feature styling and SVG marker composition
 */

export { setView, zoomToExtent } from './view';
export { setBasemap } from './basemap';
export { setControls } from './edit';
export { setPopover } from './popover';
export { setGeolocation } from './geolocation';
