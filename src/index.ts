import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import './stylesheets/fonts.scss'
import './stylesheets/app.scss'
import './components/fontmaki-def'
import './components/mcricon-def'


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
