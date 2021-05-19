import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import './stylesheets/fonts.scss'
import './stylesheets/app.scss'

// fontmaki
import './stylesheets/fontmaki.scss'
import 'ol-ext/style/FontMakiDef.js'
// FontAwesome
import 'font-awesome/css/font-awesome.min.css'
import 'ol-ext/style/FontAwesomeDef.js'

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
