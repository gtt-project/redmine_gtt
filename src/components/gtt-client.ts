import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import { Map, Feature, View, Geolocation } from 'ol'
import 'ol-ext/filter/Base'
import { Geometry, Point } from 'ol/geom'
import { GeoJSON, WKT } from 'ol/format'
import { Layer, Tile, Vector as VectorLayer } from 'ol/layer'
import { Tile as TileSource, OSM } from 'ol/source'
import { Style, Fill, Stroke, Circle } from 'ol/style'
import { OrderFunction } from 'ol/render'
import {
  defaults as interactions_defaults,
  MouseWheelZoom,
  Modify,
  Draw,
  Select,
} from 'ol/interaction'
import { focus as events_condifition_focus } from 'ol/events/condition'
import { defaults as control_defaults, Control } from 'ol/control'
import { transform, fromLonLat, transformExtent } from 'ol/proj'
import { createEmpty, extend, getCenter } from 'ol/extent'
import { FeatureCollection } from 'geojson'
import { quick_hack } from './quick_hack'
import Vector from 'ol/source/Vector'
import Ordering from 'ol-ext/render/Ordering'
import Shadow from 'ol-ext/style/Shadow'
import FontSymbol from 'ol-ext/style/FontSymbol'
import Mask from 'ol-ext/filter/Mask'
import Bar from 'ol-ext/control/Bar'
import Toggle from 'ol-ext/control/Toggle'
import Button from 'ol-ext/control/Button'
import LayerPopup from 'ol-ext/control/LayerPopup'
import Popup from 'ol-ext/overlay/Popup'
import { defaultFillStyle } from 'ol/render/canvas'

interface GttClientOption {
  target: HTMLDivElement | null
}

interface LayerObject {
  type: string
  id: number
  name: string
  options: object
}

interface FilterOption {
  location: boolean
  distance: boolean
}

export class GttClient {
  readonly map: Map
  maps: Array<Map>
  layerArray: Layer[]
  defaults: DOMStringMap
  contents: DOMStringMap
  toolbar: Bar
  filters: FilterOption
  vector: VectorLayer
  bounds: VectorLayer
  geolocation: Geolocation

  constructor(options: GttClientOption) {
    this.filters = {
      location: false,
      distance: false
    }
    this.maps = []

    // needs target
    if (!options.target) {
      return
    }

    const gtt_defaults = document.querySelector('#gtt-defaults') as HTMLDivElement
    if (!gtt_defaults) {
      return
    }

    this.defaults = gtt_defaults.dataset

    if (this.defaults.lon === null || this.defaults.lon === undefined) {
      this.defaults.lon = quick_hack.lon.toString()
    }
    if (this.defaults.lat === null || this.defaults.lat === undefined) {
      this.defaults.lat = quick_hack.lat.toString()
    }
    if (this.defaults.zoom === null || this.defaults.zoom === undefined) {
      this.defaults.zoom = quick_hack.zoom.toString()
    }
    if (this.defaults.maxzoom === null || this.defaults.maxzoom === undefined) {
      this.defaults.maxzoom = quick_hack.maxzoom.toString()
    }
    if (this.defaults.fitMaxzoom === null || this.defaults.fitMaxzoom === undefined) {
      this.defaults.fitMaxzoom = quick_hack.fitMaxzoom.toString()
    }
    if (this.defaults.geocoder === null || this.defaults.geocoder === undefined) {
      this.defaults.geocoder = JSON.stringify(quick_hack.geocoder)
    }


    this.contents = options.target.dataset

    // create map at first
    this.map = new Map({
      target: options.target,
      //layers: this.layerArray,
      interactions: interactions_defaults({mouseWheelZoom: false}).extend([
        new MouseWheelZoom({
          constrainResolution: true, // force zooming to a integer zoom
          condition: events_condifition_focus // only wheel/trackpad zoom when the map has the focus
        })
      ]),
      controls: control_defaults({
        attributionOptions: {
          collapsible: false
        }
      })
    })

    let features: Feature<Geometry>[] | null = null
    if (this.contents.geom && this.contents.geom !== null && this.contents.geom !== 'null') {
      features = new GeoJSON().readFeatures(
        JSON.parse(this.contents.geom), {
          featureProjection: 'EPSG:3857'
        }
      )
    }

    // Fix FireFox unloaded font issue
    this.reloadFontSymbol()

    // TODO: this is only necessary because setting the initial form value
    //  through the template causes encoding problems
    this.updateForm(features)
    this.layerArray = []

    if (this.contents.layers) {
      const layers = JSON.parse(this.contents.layers) as [LayerObject]
      layers.forEach((layer) => {
        const s = layer.type.split('.')
        const l = new Tile({
          visible: true,
          source: new (getTileSource(s[1], s[2]))(layer.options)
        })
        l.set('lid', layer.id)
        l.set('title', layer.name)
        l.set('baseLayer', true)
        l.on('change:visible', e => {
          const target = e.target as Tile
          if (target.getVisible()) {
            const lid = target.get('lid')
            document.cookie = `_redmine_gtt_basemap=${lid};path=/`
          }
        })
        this.layerArray.push(l)
        this.map.addLayer(l)
      }, this)
    }

    this.setBasemap()

    // Layer for project boundary
    this.bounds = new VectorLayer({
      source: new Vector(),
      style: new Style({
        fill: new Fill({
          color: 'rgba(255,255,255,0.0)'
        }),
        stroke: new Stroke({
          color: 'rgba(220,26,26,0.7)',
          // lineDash: [12,1,12],
          width: 1
        })
      })
    })
    this.bounds.set('title', 'Boundaries')
    this.bounds.set('displayInLayerSwitcher', false)
    this.layerArray.push(this.bounds)
    this.map.addLayer(this.bounds)

    const yOrdering: unknown = Ordering.yOrdering()

    this.vector = new VectorLayer({
      source: new Vector({
        'features': features,
        'useSpatialIndex': false
      }),
      renderOrder: yOrdering as OrderFunction,
      style: this.getStyle.bind(this)
    })
    this.vector.set('title', 'Features')
    this.vector.set('displayInLayerSwitcher', false)
    this.layerArray.push(this.vector)
    this.map.addLayer(this.vector)
    console.log(this.layerArray)

    // Render project boundary if bounds are available
    if (this.contents.bounds && this.contents.bounds !== null) {
      const boundary = new GeoJSON().readFeature(
        this.contents.bounds, {
          featureProjection: 'EPSG:3857'
        }
      )
      this.bounds.getSource().addFeature(boundary)
      this.layerArray.forEach((layer:Layer) => {
        if (layer.get('baseLayer')) {
          layer.addFilter(new Mask({
            feature: boundary,
            inner: false,
            fill: new Fill({
              color: [220,26,26,.1]
            })
          }))
        }
      })
    }



    // For map div focus settings
    if (options.target) {
      if (options.target.getAttribute('tabindex') == null) {
        options.target.setAttribute('tabindex', '0')
      }
    }

    // Add Toolbar
    this.toolbar = new Bar()
    this.toolbar.setPosition('bottom-left' as any) // is type.d old?
    this.map.addControl(this.toolbar)
    this.setView()
    this.setGeolocation()
    /*
    // TODO: setGeocoding
    // this.setGeocoding()
    */
    this.parseHistory()

    // Control button
    const maximizeCtrl = new Button({
      html: '<i class="icon-maximize" ></i>',
      title: "Maximize",
      handleClick: () => {
        this.zoomToExtent(true);
      }
    } as any)
    this.toolbar.addControl(maximizeCtrl)

    if (this.contents.edit) {
      this.setControls(this.contents.edit.split(' '))
    } else if (this.contents.popup) {
      this.setPopover()
    }

    // Sidebar hack
    document.querySelector('#sidebar').addEventListener('hideSidebar', _ => {
      this.maps.forEach(m => {
        m.updateSize()
      })
    })

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
          this.maps.forEach(m => {
            m.updateSize()
          })
        }, 200)
      })
    })

    // Redraw the map, when a GTT Tab gets activated
    document.querySelectorAll('#tab-gtt').forEach((element) => {
      element.addEventListener('click', () => {
        this.maps.forEach(m => {
          m.updateSize()
        })
        this.zoomToExtent()
      })
    })

    // Add LayerSwitcher Image Toolbar
    this.map.addControl(new LayerPopup())

    // Because Redmine filter functions are applied later, the Window onload
    // event provides a workaround to have filters loaded before executing
    // the following code
    window.onload = () => {
      if (document.querySelectorAll('tr#tr_bbox').length > 0) {
        this.filters.location = true
      }
      if (document.querySelectorAll('tr#tr_distance').length > 0) {
        this.filters.distance = true
      }
      document.querySelector('fieldset#location legend').addEventListener('click', (evt) => {
        const element = evt.currentTarget as HTMLLegendElement
        this.toggleAndLoadMap(element)
      })
      this.zoomToExtent()
      this.map.on('moveend', this.updateFilter)
    }

    // To fix an issue with empty map after changing the tracker type
    document.querySelectorAll('select#issue_tracker_id').forEach(element => {
      const self = this
      element.addEventListener('change', () => {
        // https://stackoverflow.com/questions/45340281/ajaxcomplete-in-pure-javascript
        (function() {
          const send = XMLHttpRequest.prototype.send
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', () => {
              self.zoomToExtent(true)
            }, {
              once: true
            })
            return send.apply(this, arguments)
          }
        })()
      })
    })

    // To fix an issue with empty map after changing the status
    document.querySelectorAll('select#issue_status_id').forEach(element => {
      const self = this
      element.addEventListener('change', () => {
        // https://stackoverflow.com/questions/45340281/ajaxcomplete-in-pure-javascript
        (function() {
          const send = XMLHttpRequest.prototype.send
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', () => {
              self.zoomToExtent(true)
            }, {
              once: true
            })
            return send.apply(this, arguments)
          }
        })()
      })
    })

    // To fix an issue with empty map after changing the project
    document.querySelectorAll('select#issue_project_id').forEach(element => {
      const self = this
      element.addEventListener('change', () => {
        // https://stackoverflow.com/questions/45340281/ajaxcomplete-in-pure-javascript
        (function() {
          const send = XMLHttpRequest.prototype.send
          XMLHttpRequest.prototype.send = function() {
            this.addEventListener('load', () => {
              self.zoomToExtent(true)
            }, {
              once: true
            })
            return send.apply(this, arguments)
          }
        })()
      })
    })

    // Handle multiple maps per page
    this.maps.push(this.map)
  }

  /**
   *  Add editing tools
   */
  setControls(types: Array<string>) {
    // Make vector features editable
    const modify = new Modify({
      features: this.vector.getSource().getFeaturesCollection()
    })

    modify.on('modifyend', evt => {
      this.updateForm(evt.features.getArray(), true)
    })

    this.map.addInteraction(modify)

    const mainbar = new Bar()
    mainbar.setPosition("top-left" as any)
    this.map.addControl(mainbar)

    const editbar = new Bar({
      toggleOne: true,	// one control active at the same time
			group: true			  // group controls together
    } as any)
    mainbar.addControl(editbar)

    types.forEach(type => {
      const draw = new Draw({
        type: type as any,
        source: this.vector.getSource()
      })

      draw.on('drawend', evt => {
        this.vector.getSource().clear()
        this.updateForm([evt.feature], true)
      })

      const control = new Toggle({
        html: `<i class="icon-${type.toLowerCase()}" ></i>`,
        title: type,
        interaction: draw
      } as any)
      editbar.addControl(control)
    })

    // Upload button
    editbar.addControl(new Button({
      html: '<i class="icon-book" ></i>',
      title: 'Upload GeoJSON',
      handleClick: () => {
        const data = prompt("Please paste a GeoJSON geometry here")
        if (data !== null) {
          const features = new GeoJSON().readFeatures(
            JSON.parse(data), {
              featureProjection: 'EPSG:3857'
            }
          )
          this.vector.getSource().clear()
          this.vector.getSource().addFeatures(features)
          this.updateForm(features)
          this.zoomToExtent()
        }
      }
    } as any))

    // Control has no setActive
    // const _controls = editbar.getControls() as unknown
    // const controls = _controls as Array<Control>
    // controls[0].setActive(true)
  }

  setPopover() {
    const popup = new Popup({
      popupClass: 'default',
      closeBox: true,
      onclose: () => {},
      positionning: 'auto',
      autoPan: true,
      autoPanAnimation: { duration: 250 }
    } as any)
    this.map.addOverlay(popup)

    // Control Select
    const select = new Select({
      layers: [this.vector],
      multi: false
    })
    this.map.addInteraction(select)

    // On selected => show/hide popup
    select.getFeatures().on(['add'], evt => {
      const feature = evt.element

      const content: Array<string> = []
      content.push(`<b>${feature.get('subject')}</b><br/>`)
      // content.push('<span>Starts at: ' + feature.get("start_date") + '</span> |');

      const popup_contents = JSON.parse(this.contents.popup)
      const url = popup_contents.href.replace(/\[(.+?)\]/g, feature.get('id'))
      content.push(`<a href="${url}">Edit</a>`)

      popup.show(getCenter(feature.getGeometry().getExtent()), content as any)
    })

    select.getFeatures().on(['remove'], _ => {
      popup.hide()
    })

    // change mouse cursor when over marker
    this.map.on('pointermove', evt => {
      if (evt.dragging) return
      const hit = this.map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: (layer) => {
          return layer === this.vector
        }
      })
      this.map.getTargetElement().style.cursor = hit ? 'pointer' : ''
    })
  }

  updateForm(features: Feature<Geometry>[] | null, updateAddressFlag: boolean = false):void {
    if (features == null) {
      return
    }
    const geom = document.querySelector('#geom') as HTMLInputElement
    if (!geom) {
      return
    }

    const writer = new GeoJSON()
    const geojson_str = writer.writeFeatures(features, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    })
    const geojson = JSON.parse(geojson_str) as FeatureCollection
    geom.value = JSON.stringify(geojson.features[0])

    const geocoder = JSON.parse(this.defaults.geocoder)
    if (updateAddressFlag && geocoder.address_field_name && features && features.length > 0) {
      const addressInput = document.querySelector(`#issue-form #attributes label:contains('${geocoder.address_field_name}')`)
        .parentNode.querySelector('p').querySelector('input') as HTMLInputElement
      if (addressInput) {
        // Todo: only works with point geometries for now for the last geometry
        const feature = features[features.length - 1].getGeometry() as any
        let coords = feature.getCoordinates()
        coords = transform(coords, 'EPSG:3857', 'EPSG:4326')
        const reverse_geocode_url = geocoder.reverse_geocode_url.replace("{lon}", coords[0].toString()).replace("{lat}", coords[1].toString())
        fetch(reverse_geocode_url)
          .then(response => response.json())
          .then(data => {
            const check = evaluateComparison(getObjectPathValue(data, geocoder.reverse_geocode_result_check_path),
              geocoder.reverse_geocode_result_check_operator,
              geocoder.reverse_geocode_result_check_value)
            const districtInput = document.querySelector(`#issue-form #attributes label:contains('${geocoder.district_field_name}')"`)
              .parentNode.querySelector('p').querySelector('input') as HTMLInputElement
            const address = getObjectPathValue(data, geocoder.reverse_geocode_result_address_path)
            let foundDistrict = false
            if (check && address) {
              addressInput.value = address
              if (districtInput) {
                const district = getObjectPathValue(data, geocoder.reverse_geocode_result_district_path)
                if (district) {
                  const regexp = new RegExp(geocoder.reverse_geocode_result_district_regexp)
                  const match = regexp.exec(district)
                  if (match && match.length === 2) {
                    districtInput.value = match[1]
                    foundDistrict = true
                  }
                }
              }
            } else {
              addressInput.value = geocoder.empty_field_value
            }
            if (!foundDistrict) {
              if (districtInput) {
                districtInput.value = ''
              }
            }
          })
      }
    }

  }

  /**
   * Decide which baselayer to show
   */
  setBasemap(): void {
    if (this.layerArray.length == 0) {
      console.error("There is no baselayer available!")
      return
    }

    let index = 0
    const cookie = parseInt(getCookie('_redmine_gtt_basemap'))
    if (cookie) {
      let lid = 0
      // Check if layer ID exists in available layers
      this.layerArray.forEach((layer) => {
        if (cookie === layer.get("lid")) {
          lid = cookie
        }
      })

      // Set selected layer visible
      this.layerArray.forEach((layer, idx) => {
        if (lid === layer.get("lid")) {
          index = idx
        }
      })
    }

    // Set layer visible
    this.layerArray[index].setVisible(true)
  }

  getColor(feature: Feature<Geometry>): string {
    let color = '#FFD700'
    const plugin_settings = this.defaults
    const status = document.querySelector('#issue_status_id') as HTMLInputElement

    let status_id = feature.get('status')
    if (status_id === null && status) {
      status_id = status.value
    }
    if (status_id) {
      const key = `status_${status_id}`
      if (key in plugin_settings) {
        color = plugin_settings[key]
      }
    }
    return color
  }

  getFontColor(_: any): string {
    const color = "#FFFFFF"
    return color
  }

  // return string but set return any because upstream jsdoc is wrong
  getSymbol(feature: Feature<Geometry>):any {
    let symbol = 'mcr-icon-write'

    const plugin_settings = this.defaults
    const issue_tracker = document.querySelector('#issue_tracker_id') as HTMLInputElement
    let tracker_id = feature.get('tracker_id')
    if (tracker_id === null && issue_tracker) {
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

  getStyle(feature: Feature<Geometry>, _: any):Style[] {
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

    // rotateWithView is boolean but upstream set number
    const rotateWithView: any = false

    const self = this

    // Apply Font Style
    styles.push(
      new Style({
        image: new FontSymbol({
          form: 'mcr',
          gradient: false,
          glyph: self.getSymbol(feature),
          fontSize: 0.7,
          radius: 18,
          offsetY: -9, // can't set offset because upstream needs to fix jsdoc
          rotation: 0,
          rotateWithView: rotateWithView,
          color: self.getFontColor(feature), // can't set color because upstream needs to fix jsdoc,
          fill: new Fill({
            color: self.getColor(feature)
          }),
          stroke: new Stroke({
            color: '#333333',
            width: 1
          }),
          opacity: 1,
        } as any),
        stroke: new Stroke({
          width: 4,
          color: self.getColor(feature)
        }),
        fill: new Fill({
          color: [255, 136, 0, 0.2]
        })
      })
    )

    return styles
  }

  /**
   *
   */
  setView() {
    const center = fromLonLat([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)])
    const view = new View({
      // Avoid flicker (map move)
      center: center,
      zoom: parseInt(this.defaults.zoom),
      maxZoom: parseInt(this.defaults.maxzoom) // applies for Mierune Tiles
    })
    this.map.setView(view)
  }

  /**
   *
   */
  zoomToExtent(force: boolean = true) {
    if (!force && (this.filters.distance || this.filters.location)) {
      // Do not zoom to extent but show the previous extent stored as cookie
      const parts = (getCookie("_redmine_gtt_permalink")).split("/");
      this.maps.forEach(m => {
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
      this.vector.getSource().getFeatures().forEach(feature => {
        extend(extent, feature.getGeometry().getExtent())
      })
      this.maps.forEach(m => {
        m.getView().fit(extent, {
          size: getMapSize(m),
          maxZoom: parseInt(this.defaults.fitMaxzoom)
        })
      })
    } else if (this.bounds.getSource().getFeatures().length > 0) {
      this.maps.forEach(m => {
        m.getView().fit(this.bounds.getSource().getExtent(), {
          size: getMapSize(m),
          maxZoom: parseInt(this.defaults.fitMaxzoom)
        })
      })
    } else {
      // Set default center, once
      this.maps.forEach(m => {
        m.getView().setCenter(transform([parseFloat(this.defaults.lon), parseFloat(this.defaults.lat)],
          'EPSG:4326', 'EPSG:3857'));
      })
      if (this.geolocation) {
        this.geolocation.once('change:position', (_) => {
          this.maps.forEach(m => {
            m.getView().setCenter(this.geolocation.getPosition())
          })
        })
      }
    }

  }

  /**
   *  Updates map settings for Redmine filter
   */
  updateFilter() {
    let center = this.map.getView().getCenter()
    let extent = this.map.getView().calculateExtent(this.map.getSize())

    center = transform(center,'EPSG:3857','EPSG:4326')
    // console.log("Map Center (WGS84): ", center);
    const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement
    fieldset.dataset.center = center.toString()
    const value_distance_3 = document.querySelector('#tr_distance #values_distance_3') as HTMLInputElement
    value_distance_3.value = center[0].toString()
    const value_distance_4 = document.querySelector('#tr_distance #values_distance_4') as HTMLInputElement
    value_distance_4.value = center[1].toString()

    // Set Permalink as Cookie
    const cookie = []
    const hash = this.map.getView().getZoom() + '/' +
      Math.round(center[0] * 1000000) / 1000000 + '/' +
      Math.round(center[1] * 1000000) / 1000000 + '/' +
      this.map.getView().getRotation()
    cookie.push("_redmine_gtt_permalink=" + hash)
    cookie.push("path=" + window.location.pathname)
    document.cookie = cookie.join(";")

    const extent_str = transformExtent(extent,'EPSG:3857','EPSG:4326').join('|')
    // console.log("Map Extent (WGS84): ",extent);
    const option = document.querySelector('select[name="v[bbox][]"]').querySelector('option') as HTMLOptionElement
    option.value = extent_str
    // adjust the value of the 'On map' option tag
    // Also adjust the JSON data that's the basis for building the filter row
    // html (this is relevant if the map is moved first and then the filter is
    // added.)
    if(window.availableFilters && window.availableFilters.bbox) {
      window.availableFilters.bbox.values = [['On map', extent]]
    }
  }


  /**
   * Parse page for WKT strings in history
   */
  parseHistory() {
    document.querySelectorAll('div#history ul.details i').forEach((item: Element) => {
      const regex = new RegExp(/\w+[\s]?(\((-?\d+.\d+\s?-?\d+.\d+,?)+\))+/g)
      const match = item.innerHTML.match(regex)
      if (match !== null) {
        const feature = new WKT().readFeature(
          match[0], {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }
        )
        const wkt = new WKT().writeFeature(
          feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
            decimals: 6
          }
        )
        item.innerHTML = `<a href="#" onclick="event.preventDefault();" class="wkt">${wkt}</a>`
      }
    })
  }

  /**
   * Add Geolocation functionality
   */
  setGeolocation() {
    this.geolocation = new Geolocation({
      tracking: false,
      projection: this.map.getView().getProjection()
    })
    this.geolocation.on('change', () => {
      console.log({
        accuracy: this.geolocation.getAccuracy(),
        altitude: this.geolocation.getAltitude(),
        altitudeAccuracy: this.geolocation.getAltitudeAccuracy(),
        heading: this.geolocation.getHeading(),
        speed: this.geolocation.getSpeed()
      })
    })
    this.geolocation.on('error', (_) => {
      // TBD
    })

    const accuracyFeature = new Feature()
    this.geolocation.on('change:accuracyGeometry', (_) => {
      accuracyFeature.setGeometry(this.geolocation.getAccuracyGeometry())
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

    this.geolocation.on('change:position', (_) => {
      const position = this.geolocation.getPosition()
      positionFeature.setGeometry(position ? new Point(position) : null)
    })

    const geolocationLayer = new VectorLayer({
      source: new Vector({
        features: [accuracyFeature, positionFeature]
      })
    })
    geolocationLayer.set('diplayInLayerSwitcher', false)
    this.map.addLayer(geolocationLayer)

    // Control button
    const geolocationCtrl = new Toggle({
      html: '<i class="icon-compass" ></i>',
      title: "Geolocation",
      active: false,
      onToggle: (active: boolean) => {
        this.geolocation.setTracking(active)
        geolocationLayer.setVisible(active)
        if (active) {
          this.map.getView().setCenter(this.geolocation.getPosition())
        }
      }
    } as any)
    this.toolbar.addControl(geolocationCtrl)
  }

  reloadFontSymbol() {
    if ('fonts' in document) {
      (document as any).fonts.ready.then(() => {
        let loaded = false;
        (document as any).fonts.forEach((f:any) => {
          if (f.family === '"mcr-icons"' || f.family === '"fontmaki"') {
            if (f.status === 'unloaded') {
              f.load().then(() => console.log('loaded'))
            } else {
              loaded = true
            }
          }
        })
        if (loaded) {
          this.maps.forEach(m => {
            const layers = m.getLayers()
            layers.forEach(layer => {
              if (layer instanceof VectorLayer &&
                  layer.getKeys().indexOf("title") >= 0 &&
                  layer.get("title") === "Features") {
                const features = (layer as any).getSource().getFeatures()
                if (features.length >= 0) {
                  const geom = features[0].getGeometry()
                  if (geom.getType() == "Point") {
                    console.log("Reloading Features layer")
                    layer.changed()
                  }
                }
              }
            })
          })
        }
      })
    }
  }

  toggleAndLoadMap(el: HTMLLegendElement) {
    const fieldset = el.parentElement.querySelector('fieldset')
    fieldset.classList.toggle('collapsed')
    fieldset.querySelector('legend').classList.toggle('icon-expended icon-collapsed');
    const div = fieldset.querySelector('div')
    div.style.display = div.style.display === 'none' ? '' : 'none'
    this.maps.forEach(function (m) {
      m.updateSize()
    })
  }


}

const getTileSource = (source: string, class_name: string): any => {
  if (source === 'source') {
    if (class_name === 'OSM') {
      return OSM
    }
  }
  return TileSource
}

const getCookie = (cname:string):string => {
  var name = cname + '='
  var ca = document.cookie.split(';')
  for(var i = 0; i < ca.length; i++) {
    var c = ca[i]
    while (c.charAt(0) == ' ') {
      c = c.substring(1)
    }
    if (c.indexOf(name) == 0) {
      return c.substring(name.length, c.length)
    }
  }
  return ''
}

const getMapSize = (map: Map) => {
  let size = map.getSize()
  if (size.length === 2 && size[0] <= 0 && size[1] <= 0) {
    const target = map.getTarget() as HTMLElement
    const target_obj = document.querySelector(`div#${target.id}`)
    size = [
      target_obj.clientWidth,
      target_obj.clientHeight
    ]
  }
  return size
}

const evaluateComparison = (left: any, operator: any, right: any): any => {
  if (typeof left == 'object') {
    left = JSON.stringify(left)
    return Function('"use strict";return (JSON.parse(\'' + left + '\')' + operator + right + ')')()
  } else {
    return Function('"use strict";return (' + left + operator + right + ')')()
  }
}

const getObjectPathValue = (obj: any, path: any, def: any = null) => {
  const stringToPath = function (path: any) {
    if (typeof path !== 'string') {
      return path
    }
    var output: Array<string> = []
    path.split('.').forEach(item => {
      item.split(/\[([^}]+)\]/g).forEach(key => {
        if (key.length > 0) {
          output.push(key)
        }
      })
    })
    return output
  }

  path = stringToPath(path)
  let current = obj
  for (var i = 0; i < path.length; i++) {
    if (!current[path[i]]) {
      return def
    }
    current = current[path[i]]
  }

  return current
}

