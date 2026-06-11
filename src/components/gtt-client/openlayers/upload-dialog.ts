import { GeoJSON } from 'ol/format';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';

import { icons, buttonIcon } from '../icons';
import { updateForm } from '../helpers';
import { zoomToExtent } from './view';

/**
 * GeoJSON upload via the native <dialog> element rendered by the
 * view_layouts_base_body_bottom hook partial (replaces the former
 * jQuery UI modal). The dialog form uses method="dialog", so the
 * Load/Cancel buttons close it and set returnValue.
 */

/**
 * Adds the upload button to the edit toolbar and wires up the dialog,
 * if uploads are enabled for this map.
 */
export function setUploadControl(instance: any, editbar: Bar): void {
  if (instance.contents.upload !== 'true') {
    return;
  }

  const dialog = document.getElementById('dialog-geojson-upload') as HTMLDialogElement | null;
  if (!dialog || typeof dialog.showModal !== 'function') {
    return;
  }

  const textarea = dialog.querySelector('textarea') as HTMLTextAreaElement | null;
  const fileSelector = dialog.querySelector('#file-selector') as HTMLInputElement | null;

  // Fill the textarea from a selected GeoJSON file
  fileSelector?.addEventListener('change', (event: Event) => {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) {
      return;
    }
    // Check if the file is GeoJSON. Browsers report .json files as
    // application/json and .geojson files as application/geo+json or
    // with an empty type, so accept any JSON-ish type.
    if (file.type && !/json/i.test(file.type)) {
      console.warn('File is not a GeoJSON document.', file.type, file);
      return;
    }
    const fileReader = new FileReader();
    fileReader.addEventListener('load', () => {
      if (textarea) {
        textarea.value = String(fileReader.result ?? '');
      }
    });
    fileReader.readAsText(file);
  });

  // Load the features when the dialog is closed via the Load button
  dialog.addEventListener('close', () => {
    if (dialog.returnValue !== 'load') {
      return;
    }
    const data = textarea?.value;
    if (!data) {
      return;
    }
    try {
      const features = new GeoJSON().readFeatures(data, {
        featureProjection: 'EPSG:3857'
      });
      instance.vector.getSource().clear();
      if (features.length === 0) {
        // Valid GeoJSON without features clears the geometry explicitly;
        // updateForm would otherwise write "undefined" into the form field.
        updateForm(instance, null);
        return;
      }
      instance.vector.getSource().addFeatures(features);
      updateForm(instance, features);
      zoomToExtent.call(instance);
    } catch (error) {
      console.error('Failed to read GeoJSON:', error);
      instance.map.notification.show(instance.i18n.messages.invalid_geojson);
    }
  });

  editbar.addControl(new Button({
    html: buttonIcon(icons.upload),
    title: instance.i18n.control.upload,
    handleClick: () => {
      dialog.returnValue = '';
      dialog.showModal();
    }
  }));
}
