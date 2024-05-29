import { FullScreen, Rotate } from 'ol/control';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import LayerPopup from 'ol-ext/control/LayerPopup';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import { position } from 'ol-ext/control/control';

import SearchGTT from '../geocoding/SearchGTT';
import { radiansToDegrees, degreesToRadians, parseHistory } from "../helpers";
import { zoomToExtent, setGeolocation, setView, setControls, setPopover } from "../openlayers";

/**
 * Adds the toolbar and basic controls to the map instance.
 * @param {any} instance - The GttClient instance.
 */
function addToolbarAndControls(instance: any): void {
  instance.toolbar = new Bar();
  instance.toolbar.setPosition('bottom-left' as position);
  instance.map.addControl(instance.toolbar);

  setView.call(instance);
  setSearchControl(instance);
  setGeolocation.call(instance, instance.map);
  parseHistory.call(instance);
}

/**
 * Adds the search control to the map instance.
 * @param {any} map - The OpenLayers map instance.
 */
function setSearchControl(instance: any): void {
  const geocoder = JSON.parse(instance.defaults.geocoder);

  if (JSON.parse(geocoder.enabled)) {
    const searchControl = new SearchGTT({
      title: instance.i18n.control.search_location,
      reverseTitle: instance.i18n.control.reverse_location,
      placeholder: instance.i18n.control.search_placeholder,
      provider: geocoder.provider,
      providerOptions: geocoder.options,
      html: '<i class="mdi mdi-map-search-outline"></i>',
    });

    instance.map.addControl(searchControl);
  }
}

/**
 * Adds the FullScreen and Rotate controls to the map instance.
 * @param {any} instance - The GttClient instance.
 */
function addFullScreenAndRotateControls(instance: any): void {
  instance.map.addControl(new FullScreen({
    tipLabel: instance.i18n.control.fullscreen
  }));

  instance.map.addControl(new Rotate({
    tipLabel: instance.i18n.control.rotate
  }));
}

/**
 * Adds the maximize control button to the toolbar.
 * @param {any} instance - The GttClient instance.
 */
function addMaximizeControl(instance: any): void {
  const maximizeCtrl = new Button({
    html: '<i class="mdi mdi-arrow-expand-all"></i>',
    title: instance.i18n.control.maximize,
    handleClick: () => {
      zoomToExtent.call(instance, true);
    }
  });

  instance.toolbar.addControl(maximizeCtrl);
}

/**
 * Handles the map rotation functionality.
 * @param {any} instance - The GttClient instance.
 */
function handleMapRotation(instance: any): void {
  const rotationField = document.querySelector('#gtt_configuration_map_rotation') as HTMLInputElement;

  if (rotationField !== null) {
    instance.map.getView().on('change:rotation', (evt: any) => {
      rotationField.value = String(Math.round(radiansToDegrees(evt.target.getRotation())));
    });

    rotationField.addEventListener("input", (evt: any) => {
      const { target } = evt;
      if (!(target instanceof HTMLInputElement)) {
        return;
      }
      const value = target.value;
      instance.map.getView().setRotation(degreesToRadians(parseInt(value)));
    });
  }
}

/**
 * Adds either a LayerSwitcher or LayerPopup control to the map instance.
 * @param {any} instance - The GttClient instance.
 */
function addLayerSwitcherOrPopup(instance: any): void {
  if (instance.containsOverlay) {
    instance.map.addControl(new LayerSwitcher({
      reordering: false
    }));
  } else {
    instance.map.addControl(new LayerPopup());
  }
}

/**
 * Initializes the controls for the GttClient instance.
 * @this {any} - The GttClient instance.
 */
export function initControls(this: any): void {
  addToolbarAndControls(this);
  addFullScreenAndRotateControls(this);
  addMaximizeControl(this);
  handleMapRotation(this);

  if (this.contents.edit) {
    setControls.call(this, this.contents.edit.split(' '));
  } else if (this.contents.popup) {
    setPopover.call(this);
  }

  addLayerSwitcherOrPopup(this);
}
