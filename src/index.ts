/**
 * ===========================================
 * GTT Application Main Module
 * ===========================================
 *
 * Loads the styles, wires the Redmine core integrations (issue filter rows)
 * and registers the Stimulus controllers that bootstrap maps and the plugin
 * settings page (see src/controllers/).
 */

// Application styles (extracted into main.css by the build)
import './styles';

// Redmine core JS integration (buildFilterRow wrapper for spatial filters)
import './components/gtt-client/redmine';

// Stimulus controllers (gtt-map, gtt-settings, gtt-icon-picker, ...)
import './controllers';

import { GttClient, GttEvent } from './components/gtt-client';

/**
 * @deprecated Maps attach via the gtt-map Stimulus controller. This shim
 * remains for other gtt-project plugins that bootstrap maps manually.
 */
window.createGttClient = (target: HTMLDivElement) => {
  new GttClient({ target });
};

/**
 * Event name constants for sibling plugins and host scripts that listen for
 * the bubbling DOM CustomEvents the client dispatches, e.g.
 *   document.addEventListener(window.GttEvent.MapReady, e => e.detail.map)
 * Exposed on window because those consumers are separate bundles without
 * access to this module graph.
 */
window.GttEvent = GttEvent;
