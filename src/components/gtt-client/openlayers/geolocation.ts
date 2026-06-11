import { Map, Feature, Geolocation } from 'ol';
import { Point } from 'ol/geom';
import Vector from 'ol/source/Vector';
import VectorLayer from 'ol/layer/Vector';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { containsCoordinate } from 'ol/extent';
import Toggle from 'ol-ext/control/Toggle';

import { icons, buttonIcon } from '../icons';

/**
 * Add Geolocation functionality
 */
export function setGeolocation(this: any, currentMap: Map): void {
  const geolocation = new Geolocation({
    tracking: false,
    projection: currentMap.getView().getProjection()
  })
  this.geolocations.push(geolocation)

  geolocation.on('error', (error) => {
    console.error(error)
  })

  const accuracyFeature = new Feature()
  geolocation.on('change:accuracyGeometry', () => {
    accuracyFeature.setGeometry(geolocation.getAccuracyGeometry())
  })

  const positionFeature = new Feature()
  positionFeature.setStyle(new Style({
    image: new Circle({
      radius: 6,
      fill: new Fill({
        color: '#3399CC'
      }),
      stroke: new Stroke({
        color: '#fff',
        width: 2
      })
    })
  }))

  geolocation.on('change:position', () => {
    const position = geolocation.getPosition()
    positionFeature.setGeometry(position ? new Point(position) : null)

    const extent = currentMap.getView().calculateExtent(currentMap.getSize())
    if (!containsCoordinate(extent, position)) {
      currentMap.getView().setCenter(position)
    }
  })

  const geolocationLayer = new VectorLayer({
    source: new Vector({
      features: [accuracyFeature, positionFeature]
    })
  })
  geolocationLayer.set('displayInLayerSwitcher', false)
  currentMap.addLayer(geolocationLayer)

  // Control button
  const geolocationCtrl = new Toggle({
    html: buttonIcon(icons.geolocate),
    title: this.i18n.control.geolocation,
    active: false,
    onToggle: (active: boolean) => {
      geolocation.setTracking(active)
      geolocationLayer.setVisible(active)
      this.map.notification.show((active ? this.i18n.control.geolocation_activated : this.i18n.control.geolocation_deactivated), 2000)
    }
  })
  this.toolbar.addControl(geolocationCtrl)
}
