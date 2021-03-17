import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import './stylesheets/app.scss'

import { GttClient } from './components/gtt-client'

interface Window {
  createGttClient(target: HTMLDivElement): void
}
declare var window: Window
window.createGttClient = (target: HTMLDivElement):void => {
  new GttClient({target: target})
}
