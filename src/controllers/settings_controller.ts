import { Controller } from '@hotwired/stimulus';

import { gtt_setting } from '../components/gtt-settings';
import { fontsReady } from '../styles/fonts';

/**
 * Entry point for the plugin settings page:
 * <div data-controller="gtt-settings"> around the settings tabs.
 *
 * Replaces the former inline <script> in settings/gtt/_settings.html.erb and
 * the global window.gtt_setting bootstrap.
 */
export default class SettingsController extends Controller<HTMLElement> {
  async connect(): Promise<void> {
    this.activateTabFromUrl();
    // The icon pickers render font glyphs; wait for the icon fonts.
    await fontsReady();
    gtt_setting();
  }

  // Redmine renders the settings tabs client-side; activate the tab named in
  // the ?tab= query parameter so links into a specific tab keep working.
  private activateTabFromUrl(): void {
    const tab = new URLSearchParams(window.location.search).get('tab');
    if (!tab) {
      return;
    }
    this.element.querySelectorAll<HTMLAnchorElement>('.tabs a').forEach((link) => {
      if (link.href.includes(`tab=${tab}`)) {
        link.click();
      }
    });
  }
}
