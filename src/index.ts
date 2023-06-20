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

// Import necessary iconfonts
import { fontPromise as customIcons } from './styles/icons/custom/custom-icons-def';
import { fontPromise as materialIcons } from './styles/icons/material-design/material-design-def';

// Import GttClient and gtt_setting components from corresponding modules
import { GttClient } from './components/gtt-client';
import { gtt_setting } from './components/gtt-settings';

/**
 * Creates a GttClient instance for the given target.
 * @param target - The HTMLDivElement for which the GttClient will be created.
 */
async function createGttClient(target: HTMLDivElement) {
  await Promise.all([customIcons, materialIcons]);
  new GttClient({ target });
}

/**
 * Attaches GTT settings.
 */
async function attachGttSetting() {
  await Promise.all([customIcons, materialIcons]);
  gtt_setting();
}

// Attach the 'createGttClient' and 'attachGttSetting' functions to the global window object
// This enables them to be called from other parts of the application or directly from the browser console
(window as any).createGttClient = createGttClient;
(window as any).gtt_setting = attachGttSetting;
