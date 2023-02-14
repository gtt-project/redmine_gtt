import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import { Map, Feature, View, Geolocation, Collection } from 'ol'
import 'ol-ext/filter/Base'
import { Geometry, GeometryCollection, Point } from 'ol/geom'
import { GeoJSON, WKT } from 'ol/format'
import { Layer, Tile, Image } from 'ol/layer'
import VectorLayer from 'ol/layer/Vector'
import { OSM, XYZ, TileWMS, ImageWMS } from 'ol/source'
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
import { defaults as control_defaults, FullScreen, Rotate } from 'ol/control'
import { transform, fromLonLat, transformExtent } from 'ol/proj'
import { createEmpty, extend, getCenter, containsCoordinate } from 'ol/extent'
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
import TextButton from 'ol-ext/control/TextButton'
import LayerPopup from 'ol-ext/control/LayerPopup'
import LayerSwitcher from 'ol-ext/control/LayerSwitcher'
import Popup from 'ol-ext/overlay/Popup'
import { position } from 'ol-ext/control/control'
import { ResizeObserver } from '@juggle/resize-observer'
import VectorSource from 'ol/source/Vector'
import { FeatureLike } from 'ol/Feature'
import TileSource from 'ol/source/Tile'
import ImageSource from 'ol/source/Image'
import { Options as ImageWMSOptions } from 'ol/source/ImageWMS'
import JSONFeature from 'ol/format/JSONFeature'
import BaseEvent from 'ol/events/Event'
import { CollectionEvent } from 'ol/Collection'

interface GttClientOption {
  target: HTMLDivElement | null
}

interface LayerObject {
  type: string
  id: number
  name: string
  baselayer: boolean
  options: object
}

interface FilterOption {
  location: boolean
  distance: boolean
}

interface TileLayerSource {
  layer: typeof Tile
  source: typeof OSM | typeof XYZ | typeof TileWMS
}

interface ImageLayerSource {
  layer: typeof Image
  source: typeof ImageWMS
}

export class GttClient {
  readonly map: Map
  maps: Array<Map>
  layerArray: Layer[]
  defaults: DOMStringMap
  contents: DOMStringMap
  i18n: any
  toolbar: Bar
  filters: FilterOption
  vector: VectorLayer<VectorSource<Geometry>>
  bounds: VectorLayer<VectorSource<Geometry>>
  geolocations: Array<Geolocation>

  constructor(options: GttClientOption) {
    this.filters = {
      location: false,
      distance: false
    }
    this.maps = []
    this.geolocations = []

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
    this.i18n = JSON.parse(this.defaults.i18n)

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
        },
        zoomOptions: {
          zoomInTipLabel: this.i18n.control.zoom_in,
          zoomOutTipLabel: this.i18n.control.zoom_out
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
        const layerSource = getLayerSource(s[1], s[2])
        const tileLayerSource = layerSource as TileLayerSource
        if (tileLayerSource) {
          const l = new (tileLayerSource.layer)({
            visible: false,
            source: new (tileLayerSource.source)(layer.options as any)
          })

          l.set('lid', layer.id)
          l.set('title', layer.name)
          l.set('baseLayer', layer.baselayer)
          if( layer.baselayer ) {
            l.on('change:visible', e => {
              const target = e.target as Tile<TileSource>
              if (target.getVisible()) {
                const lid = target.get('lid')
                document.cookie = `_redmine_gtt_basemap=${lid};path=/`
              }
            })
          }
          this.layerArray.push(l)
        } else if (layerSource as ImageLayerSource) {
          const imageLayerSource = layerSource as ImageLayerSource
          const l = new (imageLayerSource.layer)({
            visible: false,
            source: new (imageLayerSource.source)(layer.options as ImageWMSOptions)
          })

          l.set('lid', layer.id)
          l.set('title', layer.name)
          l.set('baseLayer', layer.baselayer)
          if( layer.baselayer ) {
            l.on('change:visible', e => {
              const target = e.target as Image<ImageSource>
              if (target.getVisible()) {
                const lid = target.get('lid')
                document.cookie = `_redmine_gtt_basemap=${lid};path=/`
              }
            })
          }
          this.layerArray.push(l)
        }
      }, this)

      /**
       * Ordering the Layers for the LayerSwitcher Control.
       * BaseLayers are added first.
       */
      this.layerArray.forEach( (l:Layer) => {
          if( l.get("baseLayer") ) {
            this.map.addLayer(l)
          }
        }
      )

      var containsOverlay = false;

      this.layerArray.forEach( (l:Layer) => {
          if( !l.get("baseLayer") ) {
            this.map.addLayer(l)
            containsOverlay = true
          }
        }
      )
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

    this.vector = new VectorLayer<VectorSource<Geometry>>({
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

    // Render project boundary if bounds are available
    if (this.contents.bounds && this.contents.bounds !== null) {
      const boundary = new GeoJSON().readFeature(
        this.contents.bounds, {
          featureProjection: 'EPSG:3857'
        }
      )
      this.bounds.getSource().addFeature(boundary)
      if (this.contents.bounds === this.contents.geom) {
        this.vector.setVisible(false)
      }
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

    // Fix empty map issue
    this.map.once('postrender', e => {
      this.zoomToExtent(true);
    })

    // Add Toolbar
    this.toolbar = new Bar()
    this.toolbar.setPosition('bottom-left' as position)
    this.map.addControl(this.toolbar)
    this.setView()
    this.setGeocoding(this.map)
    this.setGeolocation(this.map)
    this.parseHistory()

    this.map.addControl (new FullScreen({
      tipLabel: this.i18n.control.fullscreen
    }))
    this.map.addControl (new Rotate({
      tipLabel: this.i18n.control.rotate
    }))

    // Control button
    const maximizeCtrl = new Button({
      html: '<i class="material-icons" >zoom_out_map</i>',
      title: this.i18n.control.maximize,
      handleClick: () => {
        this.zoomToExtent(true);
      }
    })
    this.toolbar.addControl(maximizeCtrl)

    if (this.contents.edit) {
      this.setControls(this.contents.edit.split(' '))
    } else if (this.contents.popup) {
      this.setPopover()
    }

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
            self.zoomToExtent(true)
            collapsedObserver.disconnect()
          }
        })
      })
      collapsedObserver.observe(self.map.getTargetElement(), { attributes: true, attributeFilter: ['style'] })
    }

    // Sidebar hack
    const resizeObserver = new ResizeObserver((entries, observer) => {
      this.maps.forEach(m => {
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
          this.maps.forEach(m => {
            m.updateSize()
          })
          this.zoomToExtent()
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
    if( containsOverlay) {
      this.map.addControl(new LayerSwitcher({
        reordering: false
      }))
    }
    else {
      this.map.addControl(new LayerPopup())
    }


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
          this.toggleAndLoadMap(element)
        })
      }
      this.zoomToExtent()
      this.map.on('moveend', this.updateFilter.bind(this))
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
    mainbar.setPosition("top-left" as position)
    this.map.addControl(mainbar)

    const editbar = new Bar({
      toggleOne: true,  // one control active at the same time
      group: true       // group controls together
    })
    mainbar.addControl(editbar)

    types.forEach((type: any, idx) => {
      const draw = new Draw({
        type: type,
        source: this.vector.getSource()
      })

      draw.on('drawend', evt => {
        this.vector.getSource().clear()
        this.updateForm([evt.feature], true)
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
        active: (idx === 0)
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
            mapObj.updateForm(features)
            mapObj.zoomToExtent()
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

  setPopover() {
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

  updateForm(features: FeatureLike[] | null, updateAddressFlag: boolean = false):void {
    if (features == null) {
      return
    }
    const geom = document.querySelector('#geom') as HTMLInputElement
    if (!geom) {
      return
    }

    const writer = new GeoJSON()
    // Convert to Feature<Geometry> type for GeoJSON writer
    const new_features: Feature<Geometry>[] = features.map((feature => {
      return new Feature<Geometry>({geometry: feature.getGeometry() as Geometry})
    }))
    const geojson_str = writer.writeFeatures(new_features, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    })
    const geojson = JSON.parse(geojson_str) as FeatureCollection
    geom.value = JSON.stringify(geojson.features[0])

    const geocoder = JSON.parse(this.defaults.geocoder)
    if (updateAddressFlag && geocoder.address_field_name && features && features.length > 0) {
      let addressInput: HTMLInputElement = null
      document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
        if (element.innerHTML.includes(geocoder.address_field_name)) {
          addressInput = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
        }
      })
      if (addressInput) {
        // Todo: only works with point geometries for now for the last geometry
        const geom = features[features.length - 1].getGeometry() as Point
        if (geom === null) {
          return
        }
        let coords = geom.getCoordinates()
        coords = transform(coords, 'EPSG:3857', 'EPSG:4326')
        const reverse_geocode_url = geocoder.reverse_geocode_url.replace("{lon}", coords[0].toString()).replace("{lat}", coords[1].toString())
        fetch(reverse_geocode_url)
          .then(response => response.json())
          .then(data => {
            const check = evaluateComparison(getObjectPathValue(data, geocoder.reverse_geocode_result_check_path),
              geocoder.reverse_geocode_result_check_operator,
              geocoder.reverse_geocode_result_check_value)
            let districtInput: HTMLInputElement = null
            document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
              if (element.innerHTML.includes(geocoder.district_field_name)) {
                districtInput = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
              }
            })
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

  getColor(feature: Feature<Geometry>, isFill: boolean = false): string {
    let color = '#000000'
    if (feature.getGeometry().getType() !== 'Point') {
      color = '#FFD700'
    }
    const plugin_settings = JSON.parse(this.defaults.pluginSettings)
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

  getFontColor(_: unknown): string {
    const color = "#FFFFFF"
    return color
  }

  getSymbol(feature: Feature<Geometry>) {
    let symbol = 'home'

    const plugin_settings = JSON.parse(this.defaults.pluginSettings)
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

  getStyle(feature: Feature<Geometry>, _: unknown):Style[] {
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
          glyph: self.getSymbol(feature),
          fontSize: 0.7,
          radius: 18,
          offsetY: -18,
          rotation: 0,
          rotateWithView: false,
          color: self.getFontColor(feature),
          fill: new Fill({
            color: self.getColor(feature)
          }),
          stroke: new Stroke({
            color: '#333333',
            width: 1
          }),
          opacity: 1,
        }),
        stroke: new Stroke({
          width: 4,
          color: self.getColor(feature)
        }),
        fill: new Fill({
          color: self.getColor(feature, true),
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
      this.geolocations.forEach(g => {
        g.once('change:position', (evt) => {
          this.maps.forEach(m => {
            m.getView().setCenter(g.getPosition())
          })
        })
      })
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
    if (fieldset) {
      fieldset.dataset.center = JSON.stringify(center)
    }
    const value_distance_3 = document.querySelector('#tr_distance #values_distance_3') as HTMLInputElement
    if (value_distance_3) {
      value_distance_3.value = center[0].toString()
    }
    const value_distance_4 = document.querySelector('#tr_distance #values_distance_4') as HTMLInputElement
    if (value_distance_4) {
      value_distance_4.value = center[1].toString()
    }

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
    const bbox = document.querySelector('select[name="v[bbox][]"]')
    if (bbox) {
      const option = bbox.querySelector('option') as HTMLOptionElement
      option.value = extent_str
    }
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
      const regex = new RegExp(/\b(?:POINT|LINESTRING|POLYGON)\b\s?(\({1,}[-]?\d+([,. ]\s?[-]?\d+)*\){1,})/gi)
      const match = item.innerHTML.match(regex)
      if (match !== null) {
        const feature = new WKT().readFeature(
          match.join(''), {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }
        )
        let wkt = new WKT().writeFeature(
          feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
            decimals: 5
          }
        )
        // Shorten long WKT's
        if (wkt.length > 30) {
          const parts = wkt.split(' ')
          wkt = parts[0] + '...' + parts[parts.length - 1]
        }
        item.innerHTML = `<a href="#" onclick="event.preventDefault();" class="wkt" data-feature="${match.join('')}">${wkt}</a>`
      }
    })
  }

  /**
   * Add Geolocation functionality
   */
  setGeolocation(currentMap: Map) {
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

  /**
   * Add Geocoding functionality
   */
  setGeocoding(currentMap: Map):void {

    // Hack to add Geocoding buttons to text fields
    // There should be a better way to do this
    const geocoder = JSON.parse(this.defaults.geocoder)
    if (geocoder.geocode_url &&
        geocoder.address_field_name &&
        document.querySelectorAll("#issue-form #attributes button.btn-geocode").length == 0)
    {
      document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
        if (element.textContent.includes(geocoder.address_field_name)) {
          element.querySelectorAll('p').forEach(p_element => {
            const button = document.createElement('button') as HTMLButtonElement
            button.name = 'button'
            button.type = 'button'
            button.className = 'btn-geocode'
            button.appendChild(document.createTextNode(geocoder.address_field_name))
            p_element.appendChild(button)
          })
        }
      })

      document.querySelectorAll('button.btn-geocode').forEach(element => {
        element.addEventListener('click', (evt) => {
          // Geocode address and add/update icon on map
          const button = evt.currentTarget as HTMLButtonElement
          if (button.previousElementSibling.querySelector('input').value != '') {
            const address = button.previousElementSibling.querySelector('input').value
            const geocode_url = geocoder.geocode_url.replace("{address}", encodeURIComponent(address))
            fetch(geocode_url)
              .then(response => response.json())
              .then(data => {
                const check = evaluateComparison(getObjectPathValue(data, geocoder.geocode_result_check_path),
                  geocoder.geocode_result_check_operator,
                  geocoder.geocode_result_check_value
                )
                if (check) {
                  const lon = getObjectPathValue(data, geocoder.geocode_result_lon_path)
                  const lat = getObjectPathValue(data, geocoder.geocode_result_lat_path)
                  const coords = [lon, lat]
                  const geom = new Point(fromLonLat(coords, 'EPSG:3857'))
                  const features = this.vector.getSource().getFeatures()
                  if (features.length > 0) {
                    features[features.length - 1].setGeometry(geom)
                  } else {
                    const feature = new Feature(geom)
                    this.vector.getSource().addFeatures([feature])
                  }
                  this.updateForm(this.vector.getSource().getFeatures())
                  this.zoomToExtent(true)

                  const _districtInput = document.querySelectorAll(`#issue-form #attributes label`)
                  let districtInput: HTMLInputElement = null
                  _districtInput.forEach(element => {
                    if (element.innerHTML.includes(geocoder.district_field_name)) {
                      districtInput = element.parentNode.querySelector('p').querySelector('input')
                    }
                  })
                  let foundDistrict = false
                  if (districtInput) {
                    const district = getObjectPathValue(data, geocoder.geocode_result_district_path)
                    if (district) {
                      const regexp = new RegExp(geocoder.geocode_result_district_regexp)
                      const match = regexp.exec(district)
                      if (match && match.length === 2) {
                        districtInput.value = match[1]
                        foundDistrict = true
                      }
                    }
                    if (!foundDistrict) {
                      if (districtInput) {
                        districtInput.value = ""
                      }
                    }
                  }
                }
              })
          }
        })
      })
    }

    if (geocoder.place_search_url &&
        geocoder.place_search_field_name &&
        document.querySelectorAll("#issue-form #attributes button.btn-placesearch").length == 0 )
    {
      document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
        if (element.innerHTML.includes(geocoder.place_search_field_name)) {
          element.querySelectorAll('p').forEach(p_element => {
            const button = document.createElement('button') as HTMLButtonElement
            button.name = 'button'
            button.type = 'button'
            button.className = 'btn-placesearch'
            button.appendChild(document.createTextNode(geocoder.place_search_field_name))
            p_element.appendChild(button)
          })
        }
      })

      document.querySelectorAll("button.btn-placesearch").forEach(element => {
        element.addEventListener('click', () => {
          if (this.vector.getSource().getFeatures().length > 0) {
            let coords = null
            this.vector.getSource().getFeatures().forEach((feature) => {
              // Todo: only works with point geometries for now for the last geometry
              coords = getCenter(feature.getGeometry().getExtent())
            })
            coords = transform(coords, 'EPSG:3857', 'EPSG:4326')
            const place_search_url = geocoder.place_search_url.replace("{lon}", coords[0].toString()).replace("{lat}", coords[1].toString())
            fetch(place_search_url)
              .then(response => response.json())
              .then(data => {
                const list:Array<any> = getObjectPathValue(data, geocoder.place_search_result_list_path)
                if (list.length > 0) {
                  const modal = document.querySelector('#ajax-modal') as HTMLDivElement
                  modal.innerHTML = `
                  <h3 class='title'>${geocoder.place_search_result_ui_title}</h3>
                  <div id='places'></div>
                  <p class='buttons'>
                  <input type='submit' value='${geocoder.place_search_result_ui_button}' onclick='hideModal(this)'/>
                  </p>
                  `
                  modal.classList.add('place_search_results')
                  list.forEach(item => {
                    const display = getObjectPathValue(item, geocoder.place_search_result_display_path)
                    const value = getObjectPathValue(item, geocoder.place_search_result_value_path)
                    if (display && value) {
                      const places = document.querySelector('div#places') as HTMLDivElement
                      const input = document.createElement('input') as HTMLInputElement
                      input.type = 'radio'
                      input.name = 'places'
                      input.value = value
                      input.appendChild(document.createTextNode(display))
                      places.appendChild(input)
                      places.appendChild(document.createElement('br'))
                    }
                  })
                  window.showModal('ajax-model', '400px')
                  document.querySelector("p.buttons input[type='submit']").addEventListener('click', () => {
                    let input: HTMLInputElement = null
                    document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
                      if (element.innerHTML.includes(geocoder.place_search_field_name)) {
                        input = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
                      }
                    })
                    if (input) {
                      input.value = (document.querySelector("div#places input[type='radio']:checked") as HTMLInputElement).value
                    }
                  })
                } else {
                  let input: HTMLInputElement = null
                  document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
                    if (element.innerHTML.includes(geocoder.place_search_field_name)) {
                      input = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
                    }
                  })
                  if (input) {
                    input.value = geocoder.empty_field_value
                  }
                }
              })
          }
        })
      })
    }

    // disable geocoding control if plugin setting is not true
    if (this.contents.geocoding !== "true") {
      return
    }

    const mapId = currentMap.getTargetElement().getAttribute("id")

    // Control button
    const geocodingCtrl = new Toggle({
      html: '<i class="material-icons">manage_search</i>',
      title: this.i18n.control.geocoding,
      className: "ctl-geocoding",
      onToggle: (active: boolean) => {
        const text = (document.querySelector("div#" + mapId + " .ctl-geocoding div input") as HTMLInputElement)
        if (active) {
          text.focus()
        } else {
          text.blur()
          const button = document.querySelector<HTMLButtonElement>("div#" + mapId + " .ctl-geocoding button")
          button.blur()
        }
      },
      bar: new Bar({
        controls: [
          new TextButton({
            html: '<form><input name="address" type="text" /></form>'
          })
        ]
      })
    })
    this.toolbar.addControl(geocodingCtrl)

    // Make Geocoding API request
    document.querySelector<HTMLInputElement>("div#" + mapId + " .ctl-geocoding div input").addEventListener('keydown', (evt) => {
      if (evt.keyCode === 13) {
        evt.preventDefault()
        evt.stopPropagation()
      } else {
        return true
      }

      if (!geocoder.geocode_url) {
        throw new Error ("No Geocoding service configured!")
      }

      const url = geocoder.geocode_url.replace("{address}", encodeURIComponent(
        (document.querySelector("div#" + mapId + " .ctl-geocoding form input[name=address]") as HTMLInputElement).value)
      )

      fetch(url)
        .then(response => response.json())
        .then(data => {
          const check = evaluateComparison(getObjectPathValue(data, geocoder.geocode_result_check_path),
            geocoder.geocode_result_check_operator,
            geocoder.geocode_result_check_value
          )
          if (check) {
            const lon = getObjectPathValue(data, geocoder.geocode_result_lon_path)
            const lat = getObjectPathValue(data, geocoder.geocode_result_lat_path)
            const coords = [lon, lat]
            const geom = new Point(fromLonLat(coords, 'EPSG:3857'))
            currentMap.getView().fit(geom.getExtent(), {
              size: currentMap.getSize(),
              maxZoom: parseInt(this.defaults.fitMaxzoom)
            })
          }
        })

      return false
    })
  }

  reloadFontSymbol() {
    if ('fonts' in document) {
      const symbolFonts: Array<String> = []
      for (const font in FontSymbol.defs.fonts) {
        symbolFonts.push(font)
      }
      if (symbolFonts.length > 0) {
        (document as any).fonts.addEventListener('loadingdone', (e: any) => {
          const fontIndex = e.fontfaces.findIndex((font: any) => {
            return symbolFonts.indexOf(font.family) >= 0
          })
          if (fontIndex >= 0) {
            this.maps.forEach(m => {
              const layers = m.getLayers()
              layers.forEach(layer => {
                if (layer instanceof VectorLayer &&
                    layer.getKeys().indexOf("title") >= 0 &&
                    layer.get("title") === "Features") {
                  const features = layer.getSource().getFeatures()
                  const pointIndex = features.findIndex((feature: Feature) => {
                    return feature.getGeometry().getType() === "Point"
                  })
                  if (pointIndex >= 0) {
                    // console.log("Reloading Features layer")
                    layer.changed()
                  }
                }
              })
            })
          }
        })
      }
    }
  }

  toggleAndLoadMap(el: HTMLLegendElement) {
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
    this.maps.forEach(function (m) {
      m.updateSize()
    })
  }
}

const getLayerSource = (source: string, class_name: string): TileLayerSource | ImageLayerSource | undefined => {
  if (source === 'source') {
    if (class_name === 'OSM') {
      return { layer: Tile, source: OSM }
    } else if (class_name === 'XYZ') {
      return { layer: Tile, source: XYZ }
    } else if (class_name === 'TileWMS') {
      return { layer: Tile, source: TileWMS }
    } else if (class_name === 'ImageWMS') {
      return { layer: Image, source: ImageWMS }
    }
  }
  return undefined
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

/**
 * Extend core Redmine's buildFilterRow method
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;
window.buildFilterRow = function(field, operator, values) {
  if (field == 'distance') {
    buildDistanceFilterRow(operator, values)
  } else {
    window.buildFilterRowWithoutDistanceFilter(field, operator, values)
  }
}

const buildDistanceFilterRow = (operator: any, values: any):void => {
  const field = 'distance'
  const fieldId = field
  const filterTable = document.querySelector('#filters-table') as HTMLTableElement
  const filterOptions = window.availableFilters[field]
  if (!filterOptions) {
    return
  }
  const operators = window.operatorByType[filterOptions['type']]
  const filterValues = filterOptions['values']

  const tr = document.createElement('tr') as HTMLTableRowElement
  tr.className = 'filter'
  tr.id = `tr_${fieldId}`
  tr.innerHTML = `
  <td class="field">
    <input checked="checked" id="cb_${fieldId}" name="f[]" value="${field}" type="checkbox">
    <label for="cb_${fieldId}">${filterOptions['name']}</label>
  </td>
  <td class="operator">
    <select id="operators_${fieldId}" name="op[${field}]">
  </td>
  <td class="values"></td>
  `
  filterTable.appendChild(tr)

  const select = tr.querySelector('td.operator select') as HTMLSelectElement
  for (let i = 0; i < operators.length; i++) {
    const option = document.createElement('option')
    option.value = operators[i]
    option.text = window.operatorLabels[operators[i]]
    if (operators[i] == operator) {
      option.selected = true
    }
    select.append(option)
  }
  select.addEventListener('change', () => {
    window.toggleOperator(field)
  })

  const td = tr.querySelector('td.values') as HTMLTableCellElement
  td.innerHTML = `
  <span style="display:none;">
    <input type="text" name="v[${field}][]" id="values_${fieldId}_1" size="14" class="value" />
  </span>
  <span style="display:none;">
    <input type="text" name="v[${field}][]" id="values_${fieldId}_2" size="14" class="value" />
  </span>
  <input type="hidden" name="v[${field}][]" id="values_${fieldId}_3" />
  <input type="hidden" name="v[${field}][]" id="values_${fieldId}_4" />
  `;
  (document.querySelector(`#values_${fieldId}_1`) as HTMLInputElement).value = values[0]
  let base_idx = 1
  if (values.length == 2 || values.length == 4) {
    // upper bound for 'between' operator
    (document.querySelector(`#values_${fieldId}_2`) as HTMLInputElement).value = values[1]
    base_idx = 2
  }
  let x, y
  if (values.length > 2) {
    // console.log('distance center point from values: ', values[base_idx], values[base_idx+1]);
    x = values[base_idx]
    y = values[base_idx+1]
  } else {
    // console.log('taking distance from map fieldset: ', $('fieldset#location').data('center'));
    const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement
    if (!fieldset.dataset.center) {
      return
    }
    const xy = JSON.parse(fieldset.dataset.center)
    x = xy[0]
    y = xy[1]
  }
  (document.querySelector(`#values_${fieldId}_3`) as HTMLInputElement).value = x;
  (document.querySelector(`#values_${fieldId}_4`) as HTMLInputElement).value = y;
}

window.replaceIssueFormWithInitMap = window.replaceIssueFormWith
window.replaceIssueFormWith = (html) => {
  window.replaceIssueFormWithInitMap(html)
  const ol_maps = document.querySelector("form[class$='_issue'] div.ol-map") as HTMLDivElement
  if (ol_maps) {
    new GttClient({target: ol_maps})
  }
}
