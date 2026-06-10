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

// Stimulus controllers: gtt-map, gtt-settings
import './controllers';

import { GttClient } from './components/gtt-client';
import { fontsReady } from './styles/fonts';

/**
 * @deprecated Maps attach via the gtt-map Stimulus controller. This shim
 * remains for other gtt-project plugins that bootstrap maps manually.
 */
window.createGttClient = async (target: HTMLDivElement) => {
  await fontsReady();
  new GttClient({ target });
};
