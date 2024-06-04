import { Map, Feature, View, Geolocation } from 'ol';
import { Point } from 'ol/geom';
import Vector from 'ol/source/Vector'
import VectorLayer from 'ol/layer/Vector';
import { Style, Fill, Stroke, Circle } from 'ol/style';
import { createEmpty, extend, containsCoordinate } from 'ol/extent';
import { transform, fromLonLat } from 'ol/proj';

import { Draw, Select, Snap } from 'ol/interaction'
import ModifyTouch from 'ol-ext/interaction/ModifyTouch';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import Toggle from 'ol-ext/control/Toggle';
import Popup from 'ol-ext/overlay/Popup';
import Tooltip from 'ol-ext/overlay/Tooltip'
import { position } from 'ol-ext/control/control';
import { GeoJSON } from 'ol/format';

import { getCookie, getMapSize, degreesToRadians, updateForm, formatLength, formatArea } from "../helpers";

// Define the types for the Tooltip and the custom methods you added
interface ExtendedTooltip extends Tooltip {
  prevHTML?: string;
}

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
 * Create extended tooltip control
 * @returns
 */
function createTooltip(): ExtendedTooltip {
  return new Tooltip({
    maximumFractionDigits: 2,
    formatLength,
    formatArea
  }) as ExtendedTooltip;
}

/**
 *  Add editing tools
 */
export function setControls(types: Array<string>) {
  // Make vector features editable
  const modify = new ModifyTouch({
    title: this.i18n.control.remove_point,
    features: this.vector.getSource().getFeaturesCollection()
  } as any)

  modify.on('showpopup', evt => {
    const geometryType = evt.feature.getGeometry().getType();
    if (geometryType === 'Point') {
      modify.removePoint(); // don't show the popup
    }
  });

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

  // Create tooltip
  const tooltip = createTooltip();
  this.map.addOverlay(tooltip);

  // Add the draw controls
  types.forEach((type: any, idx) => {

    const draw = new Draw({
      type: type,
      source: this.vector.getSource(),
      geometryLayout: 'XYZ'
    })

    draw.on('drawstart', evt => {
      // Change the style of existing features to light gray and transparent and dashed line
      this.vector.getSource().getFeatures().forEach((feature: any) => {
        feature.setStyle(new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0.1)'
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            width: 2,
            lineDash: [5, 5]
          })
        }));
      });

      if (this.contents.measure) {
        tooltip.setFeature(evt.feature)
      }
    })

    draw.on('change:active', evt => {
      // If the Draw interaction is deactivated
      if (!evt.target.getActive()) {
        // Reset the style of existing features
        this.vector.getSource().getFeatures().forEach((feature: any) => {
          feature.setStyle(null); // Reset the style to the default style
        });
      }

      tooltip.removeFeature();
    });

    draw.on('drawend', evt => {
      tooltip.removeFeature()
      this.vector.getSource().clear()
      const feature = setZValueForGeometry(evt.feature, zValue);
      updateForm(this, [feature], true)
    })

    // Material design icon
    let mdi = 'mdi-map-marker-outline'

    switch (type.toLowerCase()) {
        case 'linestring':
        mdi = 'mdi-vector-polyline'
        break;

      case 'polygon':
        mdi = 'mdi-vector-polygon'
        break;
      }

    const control = new Toggle({
      html: `<i class="mdi ${mdi}" ></i>`,
      title: this.i18n.control[type.toLowerCase()],
      interaction: draw,
      active: false,
      onToggle: (active: boolean) => {
        modify.setActive(false);
        if (active) {
          draw.setActive(true);
        } else {
          draw.setActive(false);
        }
      }
    })
    editbar.addControl(control)
  })

  // Add the edit control
  const editModeControl = new Toggle({
    html: '<i class="mdi mdi-pencil"></i>',
    title: this.i18n.control.edit_mode,
    active: false,
    onToggle: (active: boolean) => {
      if (active) {
        modify.setActive(true);
        this.map.getInteractions().forEach((interaction: any) => {
          if (interaction instanceof Draw) {
            interaction.setActive(false);
          }
        });
        this.map.notification.show(this.i18n.messages.modify_start);
      } else {
        modify.setActive(false);
      }
    }
  });
  editbar.addControl(editModeControl);

  // if the vector layer is not empty, set the editModeControl to active
  if (this.vector.getSource().getFeatures().length > 0) {
    editModeControl.setActive(true);
  }
  // otherwise set the first draw control to active
  else {
    const firstControl = editbar.getControls()[0] as Toggle;
    firstControl.setActive(true);
  }

  // Add the clear map control
  const clearMapCtrl = new Button({
    html: '<i class="mdi mdi-delete"></i>',
    title: this.i18n.control.clear_map,
    handleClick: () => {
      this.vector.getSource().clear();
      updateForm(this, null);
    }
  });
  editbar.addControl(clearMapCtrl);

  // Add the snap interaction
  const snap = new Snap({
    source: this.vector.getSource(),
  });
  this.map.addInteraction(snap);

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
      html: '<i class="mdi mdi-file-upload"></i>',
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
    const notification = document.createElement('div');
    notification.className = 'gtt-map-notification';
    notification.innerText = this.i18n.messages.baselayer_missing;

    const mapContainer = this.map.getTargetElement();
    Object.assign(mapContainer.style, {
      position: 'relative',
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
    html: '<i class="mdi mdi-crosshairs-gps"></i>',
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
