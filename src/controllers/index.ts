import MapController from './map_controller';
import SettingsController from './settings_controller';

/**
 * Registers the plugin's Stimulus controllers against the application
 * Redmine core starts and exposes as window.Stimulus.
 *
 * The bundled @hotwired/stimulus matches the version Redmine ships; only the
 * Controller base class is bundled, the running application is core's.
 *
 * Core's bootstrap is an importmap module and runs after this classic
 * script but before DOMContentLoaded, so the usual path is the
 * DOMContentLoaded branch; registering there keeps map construction within
 * the page load (maps exist when the load event fires). The polling branch
 * only covers pathological orders (e.g. this bundle injected after
 * DOMContentLoaded) and gives up loudly after ~5s.
 */
function register(): void {
  window.Stimulus.register('gtt-map', MapController);
  window.Stimulus.register('gtt-settings', SettingsController);
}

let attempts = 0;
function registerWhenReady(): void {
  if (window.Stimulus) {
    register();
  } else if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerWhenReady, { once: true });
  } else if (attempts++ < 50) {
    setTimeout(registerWhenReady, 100);
  } else {
    console.error('[redmine_gtt] window.Stimulus never became available; controllers not registered');
  }
}

registerWhenReady();
