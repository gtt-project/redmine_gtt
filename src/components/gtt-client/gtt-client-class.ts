/// OpenLayers core imports
import 'ol/ol.css';
import { Map, Feature, Geolocation } from 'ol';
import { Geometry } from 'ol/geom';
import { GeoJSON, MVT } from 'ol/format';
import { Layer, Tile, Image, VectorTile as VTLayer } from 'ol/layer';
import VectorLayer from 'ol/layer/Vector';
import { Style, Fill, Stroke } from 'ol/style';
import { OrderFunction } from 'ol/render';
import {
  defaults as interactions_defaults,
  MouseWheelZoom,
} from 'ol/interaction';
import { focus as events_condifition_focus } from 'ol/events/condition';
import { defaults as control_defaults, FullScreen, Rotate } from 'ol/control';
import Vector from 'ol/source/Vector';
import VectorSource from 'ol/source/Vector';
import TileSource from 'ol/source/Tile';
import ImageSource from 'ol/source/Image';
import { Options as ImageWMSOptions } from 'ol/source/ImageWMS';
import { Options as VectorTileOptions } from 'ol/source/VectorTile';
import { applyStyle } from 'ol-mapbox-style';

// OpenLayers extension imports
import 'ol-ext/dist/ol-ext.min.css';
import 'ol-ext/filter/Base';
import Ordering from 'ol-ext/render/Ordering';
import Mask from 'ol-ext/filter/Mask';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import LayerPopup from 'ol-ext/control/LayerPopup';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import { position } from 'ol-ext/control/control';

// Other imports
import { ResizeObserver } from '@juggle/resize-observer';

// Import types
import {
  GttClientOption,
  LayerObject,
  FilterOption,
  TileLayerSource,
  ImageLayerSource,
  VTLayerSource,
} from './interfaces';

import { constants as quick_hack } from './constants';
import { radiansToDegrees, degreesToRadians, reloadFontSymbol, updateForm, updateFilter, parseHistory } from "./helpers";
import { getLayerSource, setBasemap, zoomToExtent, toggleAndLoadMap, setGeolocation, setView, getStyle, setControls, setPopover } from "./openlayers";
import { setGeocoding } from "./geocoding";

export default class GttClient {
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
        rotateOptions: {},
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
    reloadFontSymbol.call(this)

    // TODO: this is only necessary because setting the initial form value
    //  through the template causes encoding problems
    updateForm(this, features)
    this.layerArray = []

    if (this.contents.layers) {
      const layers = JSON.parse(this.contents.layers) as [LayerObject]
      layers.forEach((layer) => {
        const s = layer.type.split('.')
        const layerSource = getLayerSource(s[1], s[2])
        if ( layerSource.type === "TileLayerSource") {
          const config = layerSource as TileLayerSource
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
          const config = layerSource as ImageLayerSource
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
          const config = layerSource as VTLayerSource
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

    setBasemap.call(this)

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

    // For map div focus settings
    if (options.target) {
      if (options.target.getAttribute('tabindex') == null) {
        options.target.setAttribute('tabindex', '0')
      }
    }

    // Fix empty map issue
    this.map.once('postrender', e => {
      zoomToExtent.call(this, true)
    })

    // Add Toolbar
    this.toolbar = new Bar()
    this.toolbar.setPosition('bottom-left' as position)
    this.map.addControl(this.toolbar)
    setView.call(this)
    setGeocoding.call(this, this.map)
    setGeolocation.call(this, this.map)
    parseHistory.call(this)

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
        zoomToExtent.call(this, true);
      }
    })
    this.toolbar.addControl(maximizeCtrl)

    // Map rotation
    const rotation_field = document.querySelector('#gtt_configuration_map_rotation') as HTMLInputElement
    if (rotation_field !== null) {
      this.map.getView().on('change:rotation', (evt) => {
        rotation_field.value = String(Math.round(radiansToDegrees(evt.target.getRotation())))
      })

      rotation_field.addEventListener("input", (evt) => {
        const { target } = evt;
        if (!(target instanceof HTMLInputElement)) {
          return;
        }
        const value = target.value;
        this.map.getView().setRotation(degreesToRadians(parseInt(value)))
      })
    }

    if (this.contents.edit) {
      setControls.call(this, this.contents.edit.split(' '))
    } else if (this.contents.popup) {
      setPopover.call(this)
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
            zoomToExtent.call(this, true)
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
          zoomToExtent.call(this)
        }, 200)
      })
    })

    // Redraw the map, when a GTT Tab gets activated
    document.querySelectorAll('#tab-gtt').forEach((element) => {
      element.addEventListener('click', () => {
        this.maps.forEach(m => {
          m.updateSize()
        })
        zoomToExtent.call(this)
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
          toggleAndLoadMap(element)
        })
      }
      zoomToExtent.call(this)
      this.map.on('moveend', updateFilter.bind(this))
    })

    // Handle multiple maps per page
    this.maps.push(this.map)
  }

}
