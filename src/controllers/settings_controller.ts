import { Controller } from '@hotwired/stimulus';

/**
 * Entry point for the plugin settings page:
 * <div data-controller="gtt-settings"> around the settings tabs.
 *
 * The tracker icon pickers are separate gtt-icon-picker controllers; this
 * controller only handles page-level concerns.
 */
export default class SettingsController extends Controller<HTMLElement> {
  connect(): void {
    this.activateTabFromUrl();
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
