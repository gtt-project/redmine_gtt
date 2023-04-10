import { FullScreen, Rotate } from 'ol/control';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import LayerPopup from 'ol-ext/control/LayerPopup';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import { position } from 'ol-ext/control/control';

import { setGeocoding } from "../geocoding";
import { radiansToDegrees, degreesToRadians, parseHistory } from "../helpers";
import { zoomToExtent, setGeolocation, setView, setControls, setPopover } from "../openlayers";

export function initControls(this: any): void {

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
    this.map.getView().on('change:rotation', (evt: any) => {
      rotation_field.value = String(Math.round(radiansToDegrees(evt.target.getRotation())))
    })

    rotation_field.addEventListener("input", (evt: any) => {
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

  // Add LayerSwitcher Image Toolbar
  if( this.containsOverlay) {
    this.map.addControl(new LayerSwitcher({
      reordering: false
    }))
  }
  else {
    this.map.addControl(new LayerPopup())
  }
}
