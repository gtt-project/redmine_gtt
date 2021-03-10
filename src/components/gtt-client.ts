import { Map, Feature } from 'ol'
import { Geometry } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { Layer, Tile, Vector as VectorLayer } from 'ol/layer'
import { Tile as TileSource, OSM } from 'ol/source'
import { Style, Fill, Stroke } from 'ol/style'
import { FeatureCollection } from 'geojson'
import { quick_hack } from './quick_hack'
import Vector from 'ol/source/Vector'


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

  constructor(options: GttClientOption) {
    // needs target
    if (!options.target) {
      return
    }

    const gtt_defaults = document.querySelector('#gtt-defaults') as HTMLDivElement
    if (!gtt_defaults) {
      return
    }
    const defaults = gtt_defaults.dataset

    if (defaults.lon === null || defaults.lon === undefined) {
      defaults.lon = quick_hack.lon.toString()
    }
    if (defaults.lat === null || defaults.lat === undefined) {
      defaults.lat = quick_hack.lat.toString()
    }
    if (defaults.zoom === null || defaults.zoom === undefined) {
      defaults.zoom = quick_hack.zoom.toString()
    }
    if (defaults.maxzoom === null || defaults.maxzoom === undefined) {
      defaults.maxzoom = quick_hack.maxzoom.toString()
    }
    if (defaults.fitMaxzoom === null || defaults.fitMaxzoom === undefined) {
      defaults.fitMaxzoom = quick_hack.fitMaxzoom.toString()
    }
    if (defaults.geocorder === null || defaults.geocorder === undefined) {
      defaults.geocorder = JSON.stringify(quick_hack.geocoder)
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
    bounds.set('displayInLayerSwitcher', false)
    this.layerArray.push(bounds)
    console.log(this.layerArray)


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
