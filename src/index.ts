import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import './stylesheets/app.scss'

// Custom Icons
import './stylesheets/icons.css'
import './fonts/IconsDef.js'

// Material Design Icons
// https://github.com/marella/material-design-icons/tree/main/font#readme
import '@material-design-icons/font/filled.css'
import './fonts/MaterialDesignDef.js'

import { GttClient } from './components/gtt-client'
import { gtt_setting } from './components/gtt-setting'

interface Window {
  createGttClient(target: HTMLDivElement): void
  gtt_setting(): void
}
declare var window: Window
window.createGttClient = (target: HTMLDivElement):void => {
  new GttClient({target: target})
}
window.gtt_setting = (): void => {
  gtt_setting()
}
