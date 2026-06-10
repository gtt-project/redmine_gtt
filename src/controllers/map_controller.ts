import { Controller } from '@hotwired/stimulus';

import { GttClient } from '../components/gtt-client';

/**
 * Entry point for every map on a page: <div data-controller="gtt-map"> with
 * the map configuration in data attributes (see GttMapHelper#map_tag).
 *
 * connect() also fires when a map div (re)enters the DOM after an AJAX
 * replacement, e.g. when the issue form is re-rendered on tracker or project
 * change. This replaces the former inline <script> per map and the global
 * window.createGttClient bootstrap.
 *
 * The client builds synchronously, so the map exists as soon as the element
 * connects; GttClient re-renders the font-glyph symbols itself once the icon
 * fonts finish loading.
 */
export default class MapController extends Controller<HTMLDivElement> {
  client: GttClient | null = null;

  connect(): void {
    this.client = new GttClient({ target: this.element });
  }

  disconnect(): void {
    // Detach OpenLayers from the DOM node so a replaced div does not keep a
    // dangling map instance alive.
    this.client?.maps.forEach((map) => map.setTarget(undefined));
    this.client = null;
  }
}
