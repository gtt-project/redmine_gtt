import { Map, Feature, View, Geolocation } from 'ol'
import 'ol-ext/filter/Base'
import { Geometry, Point } from 'ol/geom'
import { GeoJSON, WKT } from 'ol/format'
import { Layer, Tile, Vector as VectorLayer } from 'ol/layer'
import { Tile as TileSource, OSM } from 'ol/source'
import { Style, Fill, Stroke, Circle } from 'ol/style'
import { OrderFunction } from 'ol/render'
import { defaults as interactions_defaults, MouseWheelZoom } from 'ol/interaction'
import { focus as events_condifition_focus } from 'ol/events/condition'
import { defaults as control_defaults } from 'ol/control'
import { transform } from 'ol/proj'
import { createEmpty, extend } from 'ol/extent'
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
    if (this.defaults.geocorder === null || this.defaults.geocorder === undefined) {
      this.defaults.geocorder = JSON.stringify(quick_hack.geocoder)
    }

    const contents = options.target.dataset

    let features: Feature<Geometry>[] | null = null
    if (contents.geom && contents.geom !== null) {
      features = new GeoJSON().readFeatures(
        JSON.parse(contents.geom), {
          featureProjection: 'EPSG:3857'
        }
      )
    }

    this.updateForm(features)
    this.layerArray = []

    if (contents.layers) {
      const layers = JSON.parse(contents.layers) as [LayerObject]
      layers.forEach((layer) => {
        const s = layer.type.split('.')
        const l = new Tile({
          visible: false,
          source: new (getTileSource(s[0], s[1]))(layer.options)
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
    const yOrdering: unknown = Ordering.yOrdering()

    this.vector = new VectorLayer({
      source: new Vector({
        'features': features,
        'useSpatialIndex': false
      }),
      renderOrder: yOrdering as OrderFunction,
      style: this.getStyle
    })
    this.vector.set('tilte', 'Features')
    this.vector.set('displayInLayerSwitcher', false)
    this.layerArray.push(this.vector)

    console.log(this.layerArray)

    // Render project boundary if bounds are available
    if (contents.bounds && contents.bounds !== null) {
      const boundary = new GeoJSON().readFeature(
        contents.bounds, {
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

    this.map = new Map({
      target: options.target,
      layers: this.layerArray,
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

    // Add Toolbar
    this.toolbar = new Bar()
    this.toolbar.setPosition('bottom-left' as any) // is type.d old?
    this.map.addControl(this.toolbar)

    this.setView()
    this.setGeolocation()
    // TODO: setGeocoding
    // this.setGeocoding()
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

    // Handle multiple maps per page
    this.maps.push(this.map)
  }

  updateForm(features: Feature<Geometry>[] | null):void {
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
    // TODO implement update address flag
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
    const status_id = feature.get('status') || status.value
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
    const tracker_id = feature.get('tracker_id') || issue_tracker.value
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

    // Apply Font Style
    styles.push(
      new Style({
        image: new FontSymbol({
          form: 'mcr',
          gradient: false,
          glyph: this.getSymbol(feature),
          fontSize: 0.7,
          radius: 18,
          offsetY: -9, // can't set offset because upstream needs to fix jsdoc
          rotation: 0,
          rotateWithView: rotateWithView,
          color: this.getFontColor(feature), // can't set color because upstream needs to fix jsdoc,
          fill: new Fill({
            color: this.getColor(feature)
          }),
          stroke: new Stroke({
            color: '#333333',
            width: 1
          }),
          opacity: 1,
          fontStyle: 'none'
        } as any),
        stroke: new Stroke({
          width: 4,
          color: this.getColor(feature)
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
    const view = new View({
      // Avoid flicker (map move)
      //center: ol.proj.fromLonLat([defaults.lon, defaults.lat]),
      zoom: parseInt(this.defaults.zoom),
      maxZoom: parseInt(this.defaults.maxzoom) // applies for Mierune Tiles
    })
    this.map.setView(view)
  }

  /**
   *
   */
  zoomToExtent(force: boolean) {
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
      map: this.map,
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
  console.log(size)
  return size
}
