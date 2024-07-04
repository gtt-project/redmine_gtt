import { FullScreen, Rotate } from 'ol/control';
import { Style, RegularShape, Stroke } from 'ol/style';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import LayerPopup from 'ol-ext/control/LayerPopup';
import LayerSwitcher from 'ol-ext/control/LayerSwitcher';
import Target from 'ol-ext/control/Target';
import Hover from  'ol-ext/interaction/Hover';
import Notification from 'ol-ext/control/Notification';
import { position } from 'ol-ext/control/control';
import DOMPurify from 'dompurify';

import { radiansToDegrees, degreesToRadians, parseHistory, formatLength, formatArea } from "../helpers";
import { zoomToExtent, setGeolocation, setView, setControls, setPopover } from "../openlayers";
import { createSearchControl } from '../geocoding/SearchFactory';

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

  // Add the search control if enabled in plugin settings
  if (JSON.parse(geocoder.enabled)) {
    // Custom callback function to handle the selected feature
    const handleSelectCallback = (response: any) => {
      if (response.reverse) {
        // Add copy to clipboard functionality, if available
        if (navigator.clipboard) {
          // Sanitize response title and remove all HTML tags
          const sanitizedTitle = DOMPurify.sanitize(response.title, { ALLOWED_TAGS: [] });
          const text = sanitizedTitle.replace(/<\/?[^>]+(>|$)/g, '');
          navigator.clipboard.writeText(text);
          instance.map.notification.show(instance.i18n.control.copied_location_to_clipboard);
        }
        else {
          instance.map.notification.show(response.title, 10000);
          console.warn('Clipboard API not supported');
        }
      }
    };

    // Options for creating the search control
    const options = {
      html: '<i class="mdi mdi-map-search-outline"></i>',
      html_reverse: '<i class="mdi mdi-map-marker-question-outline"></i>',
      title: instance.i18n.control.search_location,
      provider: geocoder.provider,
      providerOptions: {
        reverseTitle: instance.i18n.control.reverse_location,
        placeholder: instance.i18n.control.search_placeholder,
        ...geocoder.options
      },
    };

    // Create the search control with the custom callback
    const searchControl = createSearchControl(options, handleSelectCallback);
    instance.map.addControl(searchControl);

    // Add a listener for the select event
    searchControl.on('select', function(evt: any) {
      instance.map.getView().animate({
        center: evt.coordinate,
        zoom: Math.max(instance.map.getView().getZoom(), 18)
      });
    });
  }
}

/**
 * Adds the FullScreen and Rotate controls to the map instance.
 * @param {any} instance - The GttClient instance.
 */
function addFullScreenAndRotateControls(instance: any): void {
  instance.map.addControl(new FullScreen({
    tipLabel: instance.i18n.control.fullscreen,
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
 * Adds hover control to provide additional information
 * @param instance
 */
function addHoverControl(instance: any): void {
  const hover = new Hover({
    cursor: 'pointer',
    handleEvent: (evt: any) => {
      return true;
    },
    layerFilter: (layer: any) => {
      // Respond only to the specific vector layer
      return layer === instance.vector;
    }
  });

  instance.map.addInteraction(hover);

  // Show the length or area of the feature on hover
  hover.on('enter', (evt: any) => {
    const geometry = evt.feature.getGeometry();
    if (geometry.getType() === 'LineString') {
      instance.map.notification.show(formatLength(geometry.getLength()));
    } else if (geometry.getType() === 'Polygon') {
      instance.map.notification.show(formatArea(geometry.getArea()));
    }
  });
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
 * Adds target control to instance map.
 * @param instance
 */
function addTargetControl(instance: any): void {
  if (instance.contents.target) {
    //  Adjust the radius and stroke width for high DPI devices
    const pixelRatio = window.devicePixelRatio || 1;
    const adjustedRadius = 11 / pixelRatio;
    const adjustedStrokeWidth = 3 / pixelRatio;

    instance.map.addControl(new Target({
      composite: 'overlay',
      style: new Style({
        image: new RegularShape({
          points: 4,
          radius: adjustedRadius,
          radius2: 0,
          stroke: new Stroke({
            color: 'rgba(220,26,26,0.7)',
            width: adjustedStrokeWidth
          })
        })
      }),
    }));
  }
}

/**
 * Adds notification control
 * @param {any}  instance
 */
function addNotificationControl(instance: any): void {
  instance.map.notification = new Notification({
    // closeBox: true,
    // hideOnClick: true,
  });
  instance.map.addControl(instance.map.notification);
}

/**
 * Initializes the controls for the GttClient instance.
 * @this {any} - The GttClient instance.
 */
export function initControls(this: any): void {
  addNotificationControl(this);
  addToolbarAndControls(this);
  addFullScreenAndRotateControls(this);
  addMaximizeControl(this);
  handleMapRotation(this);
  addTargetControl(this);

  if (this.contents.measure) {
    addHoverControl(this);
  }

  if (this.contents.edit) {
    setControls.call(this, this.contents.edit.split(' '));
  } else if (this.contents.popup) {
    setPopover.call(this);
  }

  addLayerSwitcherOrPopup(this);
}
