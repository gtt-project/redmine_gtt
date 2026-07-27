import { ResizeObserver } from '@juggle/resize-observer';

import { updatePermalinkCookie } from "../helpers";
import { syncSpatialFilters } from "../redmine/filters";
import { zoomToExtent } from "../openlayers";

/**
 * Initialize event listeners for the GttClient instance.
 */
export function initEventListeners(this: any): void {
  handlePostRender.call(this);
  handleCollapsed.call(this);
  handleResize.call(this);
  handleIssueSelection.call(this);
  handleGttTabActivation.call(this);
  trackUserMapInteraction.call(this);
  handleFilters.call(this);
}

/**
 * Handles 'postrender' event to fix empty map issue by zooming to extent.
 */
function handlePostRender(this: any): void {
  this.map.once('postrender', (evt: any) => {
    zoomToExtent.call(this, true);
  });
}

/**
 * Observes map element to zoom to extent when map is expanded from a collapsed state.
 */
function handleCollapsed(this: any): void {
  if (this.contents.collapsed) {
    const collapsedObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName !== 'style') {
          return;
        }
        const mapDiv = mutation.target as HTMLDivElement;
        if (mapDiv && (mapDiv.style.display === 'block' || mapDiv.style.display === '')) {
          zoomToExtent.call(this, true);
          collapsedObserver.disconnect();
        }
      });
    });
    collapsedObserver.observe(this.map.getTargetElement(), { attributes: true, attributeFilter: ['style'] });
  }
}

/**
 * Handles map resizing for multiple maps by observing the map target element.
 * When the element transitions from hidden (zero size, e.g. inside the
 * initially hidden issue edit form) to visible, the map is additionally
 * zoomed to its features — this replaces the former edit/comment icon click
 * handler with its 500 ms setTimeout guess (#323): the observer reacts to
 * the actual size change, however the form was opened.
 */
function handleResize(this: any): void {
  let wasHidden = false;
  const resizeObserver = new ResizeObserver((entries) => {
    const rect = entries[entries.length - 1].contentRect;
    const hidden = rect.width === 0 || rect.height === 0;
    this.maps.forEach((m: any) => {
      m.updateSize();
    });
    if (wasHidden && !hidden) {
      zoomToExtent.call(this);
    }
    wasHidden = hidden;
  });
  resizeObserver.observe(this.map.getTargetElement());
}

/**
 * Handles issue selection to zoom to selected map features when a table row is clicked.
 */
function handleIssueSelection(this: any): void {
  document.querySelectorAll<HTMLTableRowElement>('table.issues tbody tr').forEach((element) => {
    element.addEventListener('click', (evt) => {
      const currentTarget = evt.currentTarget as HTMLTableRowElement;
      const id = currentTarget.id.split('-')[1];
      const feature = this.vector.getSource().getFeatureById(id);

      // Skip the click handler when there is no vector feature
      if (!feature) {
        return;
      }

      this.map.getView().fit(feature.getGeometry().getExtent(), {
        size: this.map.getSize(),
      });
    });
  });
}


/**
 * Handles GTT tab activation to redraw the map when the tab is clicked.
 */
function handleGttTabActivation(this: any): void {
  document.querySelectorAll('#tab-gtt').forEach((element) => {
    element.addEventListener('click', () => {
      this.maps.forEach((m: any) => {
        m.updateSize();
      });
      zoomToExtent.call(this);
    });
  });
}

/**
 * Distinguishes genuine user interaction (drag, scroll zoom, control
 * buttons) from programmatic view changes such as the initial fit. Spatial
 * filter values restored from the query must only be overwritten by the
 * former (see syncSpatialFilters).
 */
function trackUserMapInteraction(this: any): void {
  this.userMovedMap = false;
  const markMoved = () => { this.userMovedMap = true; };
  this.map.on('pointerdrag', markMoved);
  const viewport = this.map.getViewport() as HTMLElement;
  viewport.addEventListener('wheel', markMoved, { passive: true });
  viewport.addEventListener('click', (evt: Event) => {
    if ((evt.target as HTMLElement).closest('.ol-control button')) {
      markMoved();
    }
  });
}

/**
 * Handles map filters and load event listeners for updating the map view.
 */
function handleFilters(this: any): void {
  window.addEventListener('load', () => {
    // Check for active spatial filter rows. Core Redmine 6.x builds filter
    // rows as <div id="tr_...">, so don't constrain the element type.
    if (document.querySelector('#tr_bbox')) {
      this.filters.location = true;
    }
    if (document.querySelector('#tr_distance')) {
      this.filters.distance = true;
    }
    // With active spatial filters, restore the view the user filtered in
    // (force=false reads the permalink cookie) instead of fitting to the
    // result features.
    zoomToExtent.call(this, false);
    this.map.on('moveend', syncSpatialFilters.bind(this));
    this.map.on('moveend', updatePermalinkCookie.bind(this));
  });
}
