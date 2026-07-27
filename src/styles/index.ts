// Import OpenLayers core stylesheet for displaying map elements properly
import 'ol/ol.css';

// Import OpenLayers extensions stylesheet for extended map functionality and styling
import 'ol-ext/dist/ol-ext.min.css';

// Import custom application-specific styles which provide overall look and feel
import './scss/app.scss';

// The plugin SVG sprite (images/icons.svg) is emitted by the build itself
// (see emitStaticAssets in vite.config.ts). Control button icons are inline
// SVGs (src/components/gtt-client/icons.ts); there are no icon fonts.
