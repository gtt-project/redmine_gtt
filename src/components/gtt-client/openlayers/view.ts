import { Map, View } from 'ol';
import { createEmpty, extend } from 'ol/extent';
import { transform, fromLonLat } from 'ol/proj';

import { getCookie, getMapSize, degreesToRadians } from '../helpers';

/**
 * View handling: initial view setup and fitting the view to the
 * current features, bounds or defaults.
 */

export function setView(this: any): void {
  const center = fromLonLat([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)])
  // data-rotation may be absent; fall back to 0 instead of NaN
  const rotation = parseInt(this.map.getTargetElement().getAttribute("data-rotation")) || 0
  const view = new View({
    // Avoid flicker (map move)
    center: center,
    zoom: parseInt(this.defaults.zoom),
    maxZoom: parseInt(this.defaults.maxzoom), // applies for Mierune Tiles
    rotation: degreesToRadians(rotation)
  })
  this.map.setView(view)
}

export function zoomToExtent(this: any, force: boolean = true): void {
  // Without a permalink cookie there is no previous extent to restore;
  // fall through to the regular zoom-to-features logic.
  const permalink = getCookie("_redmine_gtt_permalink");
  if (!force && (this.filters.distance || this.filters.location) && permalink.split("/").length >= 4) {
    // Do not zoom to extent but show the previous extent stored as cookie
    const parts = permalink.split("/");
    this.maps.forEach((m: Map) => {
      m.getView().setZoom(parseInt(parts[0], 10))
      m.getView().setCenter(transform([
        parseFloat(parts[1]),
        parseFloat(parts[2])
      ],'EPSG:4326','EPSG:3857'))
      m.getView().setRotation(parseFloat(parts[3]))
    })
  } else if (this.vector.getSource().getFeatures().length > 0) {
    let extent = createEmpty()
    // Because the vector layer is set to "useSpatialIndex": false, we cannot
    // make use of "vector.getSource().getExtent()"
    this.vector.getSource().getFeatures().forEach((feature: any) => {
      extend(extent, feature.getGeometry().getExtent())
    })
    this.maps.forEach((m: Map) => {
      m.getView().fit(extent, {
        size: getMapSize(m),
        maxZoom: parseInt(this.defaults.fitMaxzoom)
      })
    })
  } else if (this.bounds.getSource().getFeatures().length > 0) {
    this.maps.forEach((m: Map) => {
      m.getView().fit(this.bounds.getSource().getExtent(), {
        size: getMapSize(m),
        maxZoom: parseInt(this.defaults.fitMaxzoom)
      })
    })
  } else {
    // Set default center, once
    this.maps.forEach((m: Map) => {
      m.getView().setCenter(transform([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)],
        'EPSG:4326', 'EPSG:3857'));
    })
    this.geolocations.forEach((g: any) => {
      g.once('change:position', () => {
        this.maps.forEach((m: Map) => {
          m.getView().setCenter(g.getPosition())
        })
      })
    })
  }
}
