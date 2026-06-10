import MapController from './map_controller';
import SettingsController from './settings_controller';

/**
 * Registers the plugin's Stimulus controllers against the application
 * Redmine core starts and exposes as window.Stimulus.
 *
 * The bundled @hotwired/stimulus matches the version Redmine ships; only the
 * Controller base class is bundled, the running application is core's.
 * Register defensively in case the core bootstrap module has not executed
 * yet when this bundle loads.
 */
function register(): void {
  window.Stimulus.register('gtt-map', MapController);
  window.Stimulus.register('gtt-settings', SettingsController);
}

if (window.Stimulus) {
  register();
} else {
  document.addEventListener('DOMContentLoaded', register);
}
