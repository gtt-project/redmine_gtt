import { ResizeObserver } from '@juggle/resize-observer';

import { updateFilter } from "../helpers";
import { zoomToExtent, toggleAndLoadMap } from "../openlayers";

/**
 * Initialize event listeners for the GttClient instance.
 */
export function initEventListeners(this: any): void {
  handlePostRender.call(this);
  handleCollapsed.call(this);
  handleResize.call(this);
  handleIssueSelection.call(this);
  handleEditIcon.call(this);
  handleGttTabActivation.call(this);
  handleFilters.call(this);
}

// Handle postrender event to fix empty map issue
function handlePostRender(this: any): void {
  this.map.once('postrender', (evt: any) => {
    zoomToExtent.call(this, true);
  });
}

// Observe map element to zoom to extent when map collapsed => expended
function handleCollapsed(this: any): void {
  if (this.contents.collapsed) {
    const collapsedObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName !== 'style') {
          return;
        }
        const mapDiv = mutation.target as HTMLDivElement;
        if (mapDiv && mapDiv.style.display === 'block') {
          zoomToExtent.call(this, true);
          collapsedObserver.disconnect();
        }
      });
    });
    collapsedObserver.observe(this.map.getTargetElement(), { attributes: true, attributeFilter: ['style'] });
  }
}

// Handle map resizing for multiple maps
function handleResize(this: any): void {
  const resizeObserver = new ResizeObserver((entries, observer) => {
    this.maps.forEach((m: any) => {
      m.updateSize();
    });
  });
  resizeObserver.observe(this.map.getTargetElement());
}

// Handle issue selection to zoom to selected map features
function handleIssueSelection(this: any): void {
  document.querySelectorAll('table.issues tbody tr').forEach((element: HTMLTableRowElement) => {
    element.addEventListener('click', (evt) => {
      const currentTarget = evt.currentTarget as HTMLTableRowElement;
      const id = currentTarget.id.split('-')[1];
      const feature = this.vector.getSource().getFeatureById(id);
      this.map.getView().fit(feature.getGeometry().getExtent(), {
        size: this.map.getSize(),
      });
    });
  });
}

// Handle edit icon click to update map size when the editable form is made visible
function handleEditIcon(this: any): void {
  document.querySelectorAll('div.contextual a.icon-edit').forEach((element: HTMLAnchorElement) => {
    element.addEventListener('click', () => {
      setTimeout(() => {
        this.maps.forEach((m: any) => {
          m.updateSize();
        });
        zoomToExtent.call(this);
      }, 200);
    });
  });
}

// Handle GTT tab activation to redraw the map
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

// Handle map filters and load event listeners
function handleFilters(this: any): void {
  window.addEventListener('load', () => {
    // Check if location filter is available
    if (document.querySelectorAll('tr#tr_bbox').length > 0) {
      this.filters.location = true;
    }
    // Check if distance filter is available
    if (document.querySelectorAll('tr#tr_distance').length > 0) {
      this.filters.distance = true;
    }
    // Set up click event listener for location filter legend
    const legend = document.querySelector('fieldset#location legend') as HTMLLegendElement;
    if (legend) {
      legend.addEventListener('click', (evt) => {
        const element = evt.currentTarget as HTMLLegendElement;
        toggleAndLoadMap(element);
      });
    }
    // Call zoomToExtent and updateFilter functions
    zoomToExtent.call(this);
    this.map.on('moveend', updateFilter.bind(this));
  });
}
