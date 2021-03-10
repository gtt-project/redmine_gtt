import { Map, Feature } from 'ol'
import 'ol-ext/filter/Base'
import { Geometry } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { Layer, Tile, Vector as VectorLayer } from 'ol/layer'
import { Tile as TileSource, OSM } from 'ol/source'
import { Style, Fill, Stroke } from 'ol/style'
import { OrderFunction } from 'ol/render'
import { FeatureCollection } from 'geojson'
import { quick_hack } from './quick_hack'
import Vector from 'ol/source/Vector'
import Ordering from 'ol-ext/render/Ordering'
import Shadow from 'ol-ext/style/Shadow'
import FontSymbol from 'ol-ext/style/FontSymbol'
import Mask from 'ol-ext/filter/Mask'

interface GttClientOption {
  target: HTMLDivElement | null
}

interface LayerObject {
  type: string
  id: number
  name: string
  options: object
}

export class GttClient {
  readonly map: Map
  layerArray: Layer[]
  defaults: DOMStringMap

  constructor(options: GttClientOption) {
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
    const bounds = new VectorLayer({
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
    bounds.set('title', 'Boundaries')
    bounds.set('displayInLayerSwitcher', false)
    this.layerArray.push(bounds)
    const yOrdering: unknown = Ordering.yOrdering()

    const vector = new VectorLayer({
      source: new Vector({
        'features': features,
        'useSpatialIndex': false
      }),
      renderOrder: yOrdering as OrderFunction,
      style: this.getStyle
    })
    vector.set('tilte', 'Features')
    vector.set('displayInLayerSwitcher', false)
    this.layerArray.push(vector)

    console.log(this.layerArray)

    // Render project boundary if bounds are available
    if (contents.bounds && contents.bounds !== null) {
      const boundary = new GeoJSON().readFeature(
        contents.bounds, {
          featureProjection: 'EPSG:3857'
        }
      )
      bounds.getSource().addFeature(boundary)
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
          // offsetY: -9, // can't set offset because upstream needs to fix jsdoc
          rotation: 0,
          rotateWithView: rotateWithView,
          // color: this.getFontColor(feature), // can't set color because upstream needs to fix jsdoc,
          fill: new Fill({
            color: this.getColor(feature)
          }),
          stroke: new Stroke({
            color: '#333333',
            width: 1
          }),
          opacity: 1,
          fontStyle: 'none'
        }),
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
