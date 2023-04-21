import { Map, Feature, View, Geolocation } from 'ol';
import { Geometry, Point } from 'ol/geom';
import Vector from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { createEmpty, extend, containsCoordinate } from 'ol/extent';
import { transform, fromLonLat } from 'ol/proj';
import Shadow from 'ol-ext/style/Shadow';
import FontSymbol from 'ol-ext/style/FontSymbol';

import { Modify, Draw, Select } from 'ol/interaction'
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import Toggle from 'ol-ext/control/Toggle';
import Popup from 'ol-ext/overlay/Popup';
import { position } from 'ol-ext/control/control';
import { GeoJSON } from 'ol/format';

import { getCookie, getMapSize, degreesToRadians, updateForm } from "../helpers";

/**
 * Get the z-value for a given geometry.
 * If the geometry is a Point, return the z-coordinate of the Point.
 * If the geometry is not a Point, return the average z-coordinate of all the coordinates in the geometry.
 * If no z-coordinate is found, return 0.
 *
 * @param {ol/geom/Geometry} geometry - The geometry to get the z-value for.
 *
 * @returns {number} The z-value of the geometry.
 */
function getZValueForGeometry(geometry: any): number {
  const geometryType = geometry.getType();
  let zValue = 0;

  if (geometryType === 'Point') {
    const coordinates = geometry.getCoordinates();
    zValue = coordinates.length >= 3 ? coordinates[2] : 0;
  } else {
    const coordinates = geometry.getCoordinates();
    let totalZ = 0;
    let numCoordinates = 0;

    if (geometryType === 'LineString' || geometryType === 'LinearRing') {
      coordinates.forEach((coordinate: any) => {
        if (coordinate.length >= 3) {
          totalZ += coordinate[2];
          numCoordinates += 1;
        }
      });
    } else if (geometryType === 'Polygon') {
      coordinates.forEach((ring: any) => {
        ring.forEach((coordinate: any) => {
          if (coordinate.length >= 3) {
            totalZ += coordinate[2];
            numCoordinates += 1;
          }
        });
      });
    } else if (geometryType === 'MultiPoint' || geometryType === 'MultiLineString' || geometryType === 'MultiPolygon') {
      coordinates.forEach((subGeometry: any) => {
        subGeometry.forEach((subCoordinate: any) => {
          if (subCoordinate.length >= 3) {
            totalZ += subCoordinate[2];
            numCoordinates += 1;
          }
        });
      });
    }

    if (numCoordinates > 0) {
      zValue = totalZ / numCoordinates;
    }
  }

  return zValue;
}

/**
 * Set the z-value for a given feature's geometry.
 * If the geometry is a Point, set the z-coordinate of the Point to the given z-value.
 * If the geometry is not a Point, set the z-coordinate of all the coordinates in the geometry to the given z-value.
 *
 * @param {ol/Feature} feature - The feature whose geometry's z-value needs to be set.
 * @param {number} zValue - The z-value to set for the geometry.
 *
 * @returns {ol/Feature} The updated feature object.
 */
function setZValueForGeometry(feature: any, zValue: number): any {
  const geometry = feature.getGeometry();
  const geometryType = geometry.getType();

  if (geometryType === 'Point') {
    const coordinates = geometry.getCoordinates();
    if (coordinates.length >= 3) {
      coordinates[2] = zValue;
      geometry.setCoordinates(coordinates);
    } else {
      geometry.setCoordinates([coordinates[0], coordinates[1], zValue]);
    }
  } else {
    const coordinates = geometry.getCoordinates();

    if (geometryType === 'LineString' || geometryType === 'LinearRing') {
      geometry.setCoordinates(coordinates.map((coordinate: any) => {
        if (coordinate.length >= 3) {
          return [coordinate[0], coordinate[1], zValue];
        } else {
          return [coordinate[0], coordinate[1], 0];
        }
      }));
    } else if (geometryType === 'Polygon') {
      geometry.setCoordinates(coordinates.map((ring: any) => {
        return ring.map((coordinate: any) => {
          if (coordinate.length >= 3) {
            return [coordinate[0], coordinate[1], zValue];
          } else {
            return [coordinate[0], coordinate[1], 0];
          }
        });
      }));
    } else if (geometryType === 'MultiPoint' || geometryType === 'MultiLineString' || geometryType === 'MultiPolygon') {
      geometry.setCoordinates(coordinates.map((subGeometry: any) => {
        return subGeometry.map((subCoordinate: any) => {
          if (subCoordinate.length >= 3) {
            return [subCoordinate[0], subCoordinate[1], zValue];
          } else {
            return [subCoordinate[0], subCoordinate[1], 0];
          }
        });
      }));
    }
  }

  feature.setGeometry(geometry);
  return feature;
}

/**
 *  Add editing tools
 */
export function setControls(types: Array<string>) {
  // Make vector features editable
  const modify = new Modify({
    features: this.vector.getSource().getFeaturesCollection()
  })

  modify.on('modifyend', evt => {
    updateForm(this, evt.features.getArray(), true)
  })

  this.map.addInteraction(modify)

  const mainbar = new Bar()
  mainbar.setPosition("top-left" as position)
  this.map.addControl(mainbar)

  const editbar = new Bar({
    toggleOne: true,  // one control active at the same time
    group: true       // group controls together
  })
  mainbar.addControl(editbar)

  let zValue = 0;
  let geometryType = 'Point';
  this.vector.getSource().forEachFeature((ftr: any) => {
    geometryType = ftr.getGeometry().getType();
    zValue = getZValueForGeometry(ftr.getGeometry());
  });

  types.forEach((type: any, idx) => {

    const draw = new Draw({
      type: type,
      source: this.vector.getSource(),
      geometryLayout: 'XYZ'
    })

    draw.on('drawend', evt => {
      this.vector.getSource().clear()
      const feature = setZValueForGeometry(evt.feature, zValue);
      updateForm(this, [feature], true)
    })

    // Material design icon
    let mdi = 'place'

    switch (type.toLowerCase()) {
        case 'linestring':
        mdi = 'polyline'
        break;

      case 'polygon':
        mdi = 'format_shapes'
        break;
      }

    const control = new Toggle({
      html: `<i class="material-icons" >${mdi}</i>`,
      title: this.i18n.control[type.toLowerCase()],
      interaction: draw,
      active: (type === geometryType)
    })
    editbar.addControl(control)
  })

  // Uses jQuery UI for GeoJSON Upload modal window
  const mapObj = this
  const dialog = $("#dialog-geojson-upload").dialog({
    autoOpen: false,
    resizable: true,
    height: 'auto',
    width: 380,
    modal: true,
    buttons: {
      [mapObj.i18n.modal.load]: function() {
        const geojson_input = document.querySelector('#dialog-geojson-upload textarea') as HTMLInputElement
        const data = geojson_input.value
        if (data !== null) {
          const features = new GeoJSON().readFeatures(
            JSON.parse(data), {
              featureProjection: 'EPSG:3857'
            }
          )
          mapObj.vector.getSource().clear()
          mapObj.vector.getSource().addFeatures(features)
          updateForm(mapObj, features)
          zoomToExtent.call(mapObj)
        }
        $(this).dialog('close')
      },
      [mapObj.i18n.modal.cancel]: function() {
        $(this).dialog('close')
      }
    }
  });

  // Upload button
  if (this.contents.upload === "true") {

    const fileSelector = document.getElementById('file-selector')
    fileSelector.addEventListener('change', (event: any) => {
      const file = event.target.files[0]
        // Check if the file is GeoJSON.
      if (file.type && !file.type.startsWith('application/geo')) {
        console.log('File is not a GeoJSON document.', file.type, file);
        return;
      }
      const fileReader = new FileReader();
      fileReader.addEventListener('load', (event: any) => {
        const geojson_input = document.querySelector('#dialog-geojson-upload textarea') as HTMLInputElement
        geojson_input.value = JSON.stringify(event.target.result, null, 2)
      });
      fileReader.readAsText(file);
    });

    editbar.addControl(new Button({
      html: '<i class="material-icons">file_upload</i>',
      title: this.i18n.control.upload,
      handleClick: () => {
        dialog.dialog('open')
      }
    }))
  }
}

/**
 *  Add popup
 */
export function setPopover() {
  const popup = new Popup({
    popupClass: 'default',
    closeBox: false,
    onclose: () => {},
    positioning: 'auto',
    anim: true
  })
  this.map.addOverlay(popup)

  // Control Select
  const select = new Select({
    layers: [this.vector],
    style: null,
    multi: false
  })
  this.map.addInteraction(select)

  // On selected => show/hide popup
  select.getFeatures().on(['add'], (evt: any) => {
    const feature = evt.element

    const content: Array<string> = []
    content.push(`<b>${feature.get('subject')}</b><br/>`)
    // content.push('<span>Starts at: ' + feature.get("start_date") + '</span> |');

    const popup_contents = JSON.parse(this.contents.popup)
    const url = popup_contents.href.replace(/\[(.+?)\]/g, feature.get('id'))
    content.push(`<a href="${url}">Edit</a>`)

    popup.show(feature.getGeometry().getFirstCoordinate(), content.join('') as any)
  })

  select.getFeatures().on(['remove'], _ => {
    popup.hide()
  })

  // change mouse cursor when over marker
  this.map.on('pointermove', (evt: any) => {
    if (evt.dragging) return
    const hit = this.map.hasFeatureAtPixel(evt.pixel, {
      layerFilter: (layer: any) => {
        return layer === this.vector
      }
    })
    this.map.getTargetElement().style.cursor = hit ? 'pointer' : ''
  })
}

/**
* Decide which baselayer to show
*/
export function setBasemap(): void {
  if (this.layerArray.length == 0) {
    console.warn(this.i18n.messages.baselayer_missing);

    const notification = document.createElement('div');
    notification.innerText = this.i18n.messages.baselayer_missing;

    const mapContainer = this.map.getTargetElement();
    Object.assign(mapContainer.style, {
      position: 'relative',
    });

    Object.assign(notification.style, {
      position: 'absolute',
      top: '55%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
    });

    mapContainer.appendChild(notification);
    return
  }

 let index = 0
 const cookie = parseInt(getCookie('_redmine_gtt_basemap'))
 if (cookie) {
   let lid = 0
   // Check if layer ID exists in available layers
   this.layerArray.forEach((layer: any) => {
     if (cookie === layer.get("lid")) {
       lid = cookie
     }
   })

   // Set selected layer visible
   this.layerArray.forEach((layer: any, idx: number) => {
     if (lid === layer.get("lid")) {
       index = idx
     }
   })
 }

 // Set layer visible
 this.layerArray[index].setVisible(true)
}

export function zoomToExtent(force: boolean = true) {
  if (!force && (this.filters.distance || this.filters.location)) {
    // Do not zoom to extent but show the previous extent stored as cookie
    const parts = (getCookie("_redmine_gtt_permalink")).split("/");
    this.maps.forEach((m: any) => {
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
    this.maps.forEach((m: any) => {
      m.getView().fit(extent, {
        size: getMapSize(m),
        maxZoom: parseInt(this.defaults.fitMaxzoom)
      })
    })
  } else if (this.bounds.getSource().getFeatures().length > 0) {
    this.maps.forEach((m: any) => {
      m.getView().fit(this.bounds.getSource().getExtent(), {
        size: getMapSize(m),
        maxZoom: parseInt(this.defaults.fitMaxzoom)
      })
    })
  } else {
    // Set default center, once
    this.maps.forEach((m: any) => {
      m.getView().setCenter(transform([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)],
        'EPSG:4326', 'EPSG:3857'));
    })
    this.geolocations.forEach((g: any) => {
      g.once('change:position', (evt: any) => {
        this.maps.forEach((m: any) => {
          m.getView().setCenter(g.getPosition())
        })
      })
    })
  }
}

/**
 * Add Geolocation functionality
 */
export function setGeolocation(currentMap: Map) {
  const geolocation = new Geolocation({
    tracking: false,
    projection: currentMap.getView().getProjection()
  })
  this.geolocations.push(geolocation)

  geolocation.on('change', (evt) => {
    // console.log({
    //   accuracy: geolocation.getAccuracy(),
    //   altitude: geolocation.getAltitude(),
    //   altitudeAccuracy: geolocation.getAltitudeAccuracy(),
    //   heading: geolocation.getHeading(),
    //   speed: geolocation.getSpeed()
    // })
  })
  geolocation.on('error', (error) => {
    // TBD
    console.error(error)
  })

  const accuracyFeature = new Feature()
  geolocation.on('change:accuracyGeometry', (evt) => {
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

  geolocation.on('change:position', (evt) => {
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
    html: '<i class="material-icons">my_location</i>',
    title: this.i18n.control.geolocation,
    active: false,
    onToggle: (active: boolean) => {
      geolocation.setTracking(active)
      geolocationLayer.setVisible(active)
    }
  })
  this.toolbar.addControl(geolocationCtrl)
}

export function toggleAndLoadMap(el: HTMLLegendElement) {
  const fieldset = el.parentElement
  fieldset.classList.toggle('collapsed')
  el.classList.toggle('icon-expended')
  el.classList.toggle('icon-collapsed')
  const div = fieldset.querySelector('div')
  if (div.style.display === 'none') {
    div.style.display = 'block'
  } else {
    div.style.display = 'none'
  }
  this.maps.forEach(function (m: any) {
    m.updateSize()
  })
}

export function setView() {
  const center = fromLonLat([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)])
  const view = new View({
    // Avoid flicker (map move)
    center: center,
    zoom: parseInt(this.defaults.zoom),
    maxZoom: parseInt(this.defaults.maxzoom), // applies for Mierune Tiles
    rotation: degreesToRadians(parseInt(this.map.getTargetElement().getAttribute("data-rotation")))
  })
  this.map.setView(view)
}

export function getStyle(feature: Feature<Geometry>, _: unknown):Style[] {
  const styles: Style[] = []

  // Apply Shadow
  styles.push(
    new Style({
      image: new Shadow({
        radius: 15,
        blur: 5,
        offsetX: 0,
        offsetY: 0,
        fill: new Fill({
          color: 'rgba(0,0,0,0.5)'
        })
      })
    })
  )

  const self = this

  // Apply Font Style
  styles.push(
    new Style({
      image: new FontSymbol({
        form: 'blazon',
        gradient: false,
        glyph: getSymbol(self, feature),
        fontSize: 0.7,
        radius: 18,
        offsetY: -18,
        rotation: 0,
        rotateWithView: false,
        color: getFontColor(feature),
        fill: new Fill({
          color: getColor(self, feature)
        }),
        stroke: new Stroke({
          color: '#333333',
          width: 1
        }),
        opacity: 1,
      }),
      stroke: new Stroke({
        width: 4,
        color: getColor(self, feature)
      }),
      fill: new Fill({
        color: getColor(self, feature, true),
      })
    })
  )

  return styles
}

/**
 * TODO: check if this is acually used
 */
export function getColor(mapObj: any, feature: Feature<Geometry>, isFill: boolean = false): string {
  let color = '#000000'
  if (feature.getGeometry().getType() !== 'Point') {
    color = '#FFD700'
  }
  const plugin_settings = JSON.parse(mapObj.defaults.pluginSettings)
  const status = document.querySelector('#issue_status_id') as HTMLInputElement

  let status_id = feature.get('status_id')
  if (!status_id && status) {
    status_id = status.value
  }
  if (status_id) {
    const key = `status_${status_id}`
    if (key in plugin_settings) {
      color = plugin_settings[key]
    }
  }
  if (isFill && color !== null && color.length === 7) {
    color = color + '33' // Add alpha: 0.2
  }
  return color
}

/**
 * TODO: check if this is acually used
 */
export function getFontColor(_: unknown): string {
  const color = "#FFFFFF"
  return color
}

/**
 * TODO: check if this is acually used
 */
export function getSymbol(mapObj: any, feature: Feature<Geometry>) {
  let symbol = 'home'

  const plugin_settings = JSON.parse(mapObj.defaults.pluginSettings)
  const issue_tracker = document.querySelector('#issue_tracker_id') as HTMLInputElement
  let tracker_id = feature.get('tracker_id')
  if (!tracker_id && issue_tracker) {
    tracker_id = issue_tracker.value
  }
  if (tracker_id) {
    const key = `tracker_${tracker_id}`
    if (key in plugin_settings) {
      symbol = plugin_settings[key]
    }
  }
  return symbol
}
