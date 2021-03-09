import { Map, Feature } from 'ol'
import { Geometry } from 'ol/geom'
import { GeoJSON } from 'ol/format'
import { Tile } from 'ol/layer'
import { Tile as TileSource, OSM } from 'ol/source'
import { FeatureCollection } from 'geojson'
import { quick_hack } from './quick_hack'

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
  layerArray: Tile[]

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
}

const getTileSource = (source: string, class_name: string): any => {
  if (source === 'source') {
    if (class_name === 'OSM') {
      return OSM
    }
  }
  return TileSource
}
