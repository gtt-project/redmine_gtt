import { Controller } from '@hotwired/stimulus';

import { GttClient } from '../components/gtt-client';
import { fontsReady } from '../styles/fonts';

/**
 * Entry point for every map on a page: <div data-controller="gtt-map"> with
 * the map configuration in data attributes (see GttMapHelper#map_tag).
 *
 * connect() also fires when a map div (re)enters the DOM after an AJAX
 * replacement, e.g. when the issue form is re-rendered on tracker or project
 * change. This replaces the former inline <script> per map and the global
 * window.createGttClient bootstrap.
 */
export default class MapController extends Controller<HTMLDivElement> {
  client: GttClient | null = null;

  // Stimulus does not await connect(); the token invalidates a pending
  // continuation when the element disconnects (or reconnects) while the
  // fonts are still loading, so no client is built for a stale node.
  private connectionToken = 0;

  async connect(): Promise<void> {
    const token = ++this.connectionToken;
    // Map symbols are font glyphs; wait for the icon fonts so features
    // render correctly on the first paint.
    await fontsReady();
    if (token !== this.connectionToken || !this.element.isConnected) {
      return;
    }
    this.client = new GttClient({ target: this.element });
  }

  disconnect(): void {
    this.connectionToken++;
    // Detach OpenLayers from the DOM node so a replaced div does not keep a
    // dangling map instance alive.
    this.client?.maps.forEach((map) => map.setTarget(undefined));
    this.client = null;
  }
}
