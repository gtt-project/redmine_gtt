/**
 * ===========================================
 * GTT Application Main Module
 * ===========================================
 *
 * This module is responsible for managing
 * the GTT application. Its main tasks include:
 *   - Importing required stylesheets
 *   - Importing components (GttClient and gtt_setting)
 *   - Attaching essential functions to the global window object
 */

// Import application styles from the 'styles' module
import './styles';

// Import GttClient and gtt_setting components from corresponding modules
import { GttClient } from './components/gtt-client';
import { gtt_setting } from './components/gtt-setting';

// Define functions that will be attached to the global window object

/**
 * Creates a GttClient instance for the given target.
 * @param target - The HTMLDivElement for which the GttClient will be created.
 */
function createGttClient(target: HTMLDivElement) {
  new GttClient({ target });
}

/**
 * Attaches GTT settings.
 */
function attachGttSetting() {
  gtt_setting();
}

// Attach the 'createGttClient' and 'attachGttSetting' functions to the global window object
// This enables them to be called from other parts of the application or directly from the browser console
(window as any).createGttClient = createGttClient;
(window as any).gtt_setting = attachGttSetting;
