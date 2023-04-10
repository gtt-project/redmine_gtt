import { Feature } from 'ol';
import { Layer, Tile, Image, Vector as VectorLayer, VectorTile as VTLayer } from 'ol/layer';
import { Vector as VectorSource, Image as ImageSource, Tile as TileSource } from 'ol/source';
import { GeoJSON, MVT } from 'ol/format';
import { Geometry } from 'ol/geom';
import { Options as ImageWMSOptions } from 'ol/source/ImageWMS';
import { Options as VectorTileOptions } from 'ol/source/VectorTile';
import { Style, Fill, Stroke } from 'ol/style';
import { OrderFunction } from 'ol/render';

import Ordering from 'ol-ext/render/Ordering';
import Mask from 'ol-ext/filter/Mask';
import { applyStyle } from 'ol-mapbox-style';

import { ILayerObject, ITileLayerSource, IImageLayerSource, IVTLayerSource } from '../interfaces';
import { updateForm, reloadFontSymbol } from "../helpers";
import { getLayerSource, setBasemap, getStyle } from "../openlayers";

export function initLayers(this: any): Layer[] {
  this.layerArray = [];

  let features: Feature<Geometry>[] | null = null
  if (this.contents.geom && this.contents.geom !== null && this.contents.geom !== 'null') {
    features = new GeoJSON().readFeatures(
      JSON.parse(this.contents.geom), {
        featureProjection: 'EPSG:3857'
      }
    )
  }

  // Fix FireFox unloaded font issue
  reloadFontSymbol.call(this)

  // TODO: this is only necessary because setting the initial form value
  //  through the template causes encoding problems
  updateForm(this, features)

  if (this.contents.layers) {
    const layers = JSON.parse(this.contents.layers) as [ILayerObject]
    layers.forEach((layer) => {
      const s = layer.type.split('.')
      const layerSource = getLayerSource(s[1], s[2])
      if ( layerSource.type === "TileLayerSource") {
        const config = layerSource as ITileLayerSource
        const l = new (config.layer)({
          visible: false,
          source: new (config.source)(layer.options as any)
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
      } else if (layerSource.type === "ImageLayerSource") {
        const config = layerSource as IImageLayerSource
        const l = new (config.layer)({
          visible: false,
          source: new (config.source)(layer.options as ImageWMSOptions)
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
      } else if (layerSource.type === "VTLayerSource") {
        const config = layerSource as IVTLayerSource
        const options = layer.options as VectorTileOptions
        options.format = new MVT()
        const l = new (config.layer)({
          visible: false,
          source: new (config.source)(options),
          declutter: true
        }) as VTLayer

        // Apply style URL if provided
        if ("styleUrl" in options) {
          applyStyle(l,options.styleUrl)
        }

        l.set('lid', layer.id)
        l.set('title', layer.name)
        l.set('baseLayer', layer.baselayer)
        if( layer.baselayer ) {
          l.on('change:visible', (e: { target: any }) => {
            const target = e.target as any
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
    })

    this.containsOverlay = false;

    this.layerArray.forEach( (l:Layer) => {
      if( !l.get("baseLayer") ) {
        this.map.addLayer(l)
        this.containsOverlay = true
      }
    })
  }

  setBasemap.call(this)

  // Layer for project boundary
  this.bounds = new VectorLayer({
    source: new VectorSource(),
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
    source: new VectorSource({
      'features': features,
      'useSpatialIndex': false
    }),
    renderOrder: yOrdering as OrderFunction,
    style: getStyle.bind(this)
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

  return this.layerArray;
}
