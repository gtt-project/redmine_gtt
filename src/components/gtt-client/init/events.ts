import { ResizeObserver } from '@juggle/resize-observer';

import { updateFilter } from "../helpers";
import { zoomToExtent, toggleAndLoadMap } from "../openlayers";

export function initEventListeners(this: any): void {

  // Fix empty map issue
  this.map.once('postrender', (evt: any) => {
    zoomToExtent.call(this, true)
  })

  // Zoom to extent when map collapsed => expended
  if (this.contents.collapsed) {
    const self = this
    const collapsedObserver = new MutationObserver((mutations) => {
      // const currentMap = this.map
      mutations.forEach(function(mutation) {
        if (mutation.attributeName !== 'style') {
          return
        }
        const mapDiv = mutation.target as HTMLDivElement
        if (mapDiv && mapDiv.style.display === 'block') {
          zoomToExtent.call(this, true)
          collapsedObserver.disconnect()
        }
      })
    })
    collapsedObserver.observe(self.map.getTargetElement(), { attributes: true, attributeFilter: ['style'] })
  }

  // Sidebar hack
  const resizeObserver = new ResizeObserver((entries, observer) => {
    this.maps.forEach((m: any) => {
      m.updateSize()
    })
  })
  resizeObserver.observe(this.map.getTargetElement())

  // When one or more issues is selected, zoom to selected map features
  document.querySelectorAll('table.issues tbody tr').forEach((element: HTMLTableRowElement) => {
    element.addEventListener('click', (evt) => {
      const currentTarget = evt.currentTarget as HTMLTableRowElement
      const id = currentTarget.id.split('-')[1]
      const feature = this.vector.getSource().getFeatureById(id)
      this.map.getView().fit(feature.getGeometry().getExtent(), {
        size: this.map.getSize()
      })
    })
  })

  // Need to update size of an invisible map, when the editable form is made
  // visible. This doesn't look like a good way to do it, but this is more of
  // a Redmine problem
  document.querySelectorAll('div.contextual a.icon-edit').forEach((element: HTMLAnchorElement) => {
    element.addEventListener('click', () => {
      setTimeout(() => {
        this.maps.forEach((m: any) => {
          m.updateSize()
        })
        zoomToExtent.call(this)
      }, 200)
    })
  })

  // Redraw the map, when a GTT Tab gets activated
  document.querySelectorAll('#tab-gtt').forEach((element) => {
    element.addEventListener('click', () => {
      this.maps.forEach((m: any) => {
        m.updateSize()
      })
      zoomToExtent.call(this)
    })
  })

  // Because Redmine filter functions are applied later, the Window onload
  // event provides a workaround to have filters loaded before executing
  // the following code
  window.addEventListener('load', () => {
    if (document.querySelectorAll('tr#tr_bbox').length > 0) {
      this.filters.location = true
    }
    if (document.querySelectorAll('tr#tr_distance').length > 0) {
      this.filters.distance = true
    }
    const legend = document.querySelector('fieldset#location legend') as HTMLLegendElement
    if (legend) {
      legend.addEventListener('click', (evt) => {
        const element = evt.currentTarget as HTMLLegendElement
        toggleAndLoadMap(element)
      })
    }
    zoomToExtent.call(this)
    this.map.on('moveend', updateFilter.bind(this))
  })
}
