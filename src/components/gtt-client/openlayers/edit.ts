import { Style, Fill, Stroke } from 'ol/style';
import { Draw, Snap } from 'ol/interaction';
import ModifyTouch from 'ol-ext/interaction/ModifyTouch';
import Bar from 'ol-ext/control/Bar';
import Button from 'ol-ext/control/Button';
import Toggle from 'ol-ext/control/Toggle';
import Tooltip from 'ol-ext/overlay/Tooltip';
import { position } from 'ol-ext/control/control';

import { icons, buttonIcon } from '../icons';
import { updateForm, formatLength, formatArea } from '../helpers';
import { isTouchDevice, isMacOS } from '../helpers/platforms';
import { getZValueForGeometry, setZValueForGeometry } from './zcoords';
import { setUploadControl } from './upload-dialog';

/**
 * Editing tools: draw/modify/clear controls, measure tooltip, snapping
 * and the GeoJSON upload button.
 */

/**
 * Helper class to manage the visibility of controls.
 */
class ControlManager {
  static hide(controls: any[]) {
    controls.forEach(control => {
      control.element.style.display = 'none';
    });
  }

  static show(controls: any[]) {
    controls.forEach(control => {
      control.element.style.display = '';
    });
  }
}

/**
 *  Add editing tools
 */
export function setControls(this: any, types: Array<string>): void {
  // Make vector features editable
  const modify = new ModifyTouch({
    title: this.i18n.control.remove_point,
    features: this.vector.getSource().getFeaturesCollection()
  } as any)

  modify.on('showpopup', evt => {
    const geometryType = evt.feature.getGeometry().getType();
    if (geometryType === 'Point') {
      modify.removePoint(); // don't show the popup
    }
  });

  modify.on('modifyend', evt => {
    updateForm(this, evt.features.getArray(), true)
  })

  this.map.addInteraction(modify)

  const mainbar = new Bar()
  mainbar.setPosition("top-left" as position)
  this.map.addControl(mainbar)

  const editbar = new Bar({
    toggleOne: true,  // one control active at the same time
    group: true       // group controls together
  })
  mainbar.addControl(editbar)

  let zValue = 0;
  this.vector.getSource().forEachFeature((ftr: any) => {
    zValue = getZValueForGeometry(ftr.getGeometry());
  });

  // Create tooltip for measurements while drawing
  const tooltip = new Tooltip({
    maximumFractionDigits: 2,
    formatLength,
    formatArea
  });
  this.map.addOverlay(tooltip);

  // Add the draw controls
  types.forEach((type: any) => {

    const draw = new Draw({
      type: type,
      source: this.vector.getSource(),
      geometryLayout: 'XYZ'
    })

    draw.on('drawstart', evt => {
      // Change the style of existing features to light gray and transparent and dashed line
      this.vector.getSource().getFeatures().forEach((feature: any) => {
        feature.setStyle(new Style({
          fill: new Fill({
            color: 'rgba(0, 0, 0, 0.1)'
          }),
          stroke: new Stroke({
            color: 'rgba(0, 0, 0, 0.5)',
            width: 2,
            lineDash: [5, 5]
          })
        }));
      });

      if (this.contents.measure) {
        tooltip.setFeature(evt.feature)
      }
    })

    draw.on('change:active', evt => {
      // If the Draw interaction is deactivated
      if (!evt.target.getActive()) {
        // Reset the style of existing features
        this.vector.getSource().getFeatures().forEach((feature: any) => {
          feature.setStyle(null); // Reset the style to the default style
        });
      }

      tooltip.removeFeature();
    });

    draw.on('drawend', evt => {
      tooltip.removeFeature()
      this.vector.getSource().clear()
      const feature = setZValueForGeometry(evt.feature, zValue);
      updateForm(this, [feature], true)
      ControlManager.show([editModeControl, clearMapCtrl]);
    })

    // Draw tool icon per geometry type
    let drawIcon: string = icons.drawPoint

    switch (type.toLowerCase()) {
        case 'linestring':
        drawIcon = icons.drawLine
        break;

      case 'polygon':
        drawIcon = icons.drawPolygon
        break;
      }

    const control = new Toggle({
      html: buttonIcon(drawIcon),
      title: this.i18n.control[type.toLowerCase()],
      interaction: draw,
      active: false,
      onToggle: (active: boolean) => {
        modify.setActive(false);
        if (active) {
          draw.setActive(true);
        } else {
          draw.setActive(false);
        }
      }
    })
    editbar.addControl(control)
  })

  // Add the edit control
  const editModeControl = new Toggle({
    html: buttonIcon(icons.edit),
    title: this.i18n.control.edit_mode,
    active: false,
    onToggle: (active: boolean) => {
      if (active) {
        modify.setActive(true);
        this.map.getInteractions().forEach((interaction: any) => {
          if (interaction instanceof Draw) {
            interaction.setActive(false);
          }
        });

        if (this.vector.getSource().getFeatures().length > 0) {
          const firstFeature = this.vector.getSource().getFeatures()[0];
          if (firstFeature && firstFeature.getGeometry().getType() !== 'Point') {
            // Code to execute if the first feature is not a Point
            let message = this.i18n.messages.modify_start;
            if (isTouchDevice()) {
              message = this.i18n.messages.modify_start_touch;
            } else if (isMacOS()) {
              message = this.i18n.messages.modify_start_mac;
            }
            this.map.notification.show(message);
          }
        }
      } else {
        modify.setActive(false);
      }
    }
  });
  editbar.addControl(editModeControl);

  // Add the clear map control
  const clearMapCtrl = new Button({
    html: buttonIcon(icons.remove),
    title: this.i18n.control.clear_map,
    handleClick: () => {
      this.vector.getSource().clear();
      updateForm(this, null);
      (editbar.getControls()[0] as Toggle).setActive(true);
      ControlManager.hide([editModeControl, clearMapCtrl]);
    }
  });
  editbar.addControl(clearMapCtrl);

  // if the vector layer is not empty, set the editModeControl to active
  if (this.vector.getSource().getFeatures().length > 0) {
    editModeControl.setActive(true);
    ControlManager.show([editModeControl, clearMapCtrl]);
  }
  // otherwise set the first draw control to active
  else {
    (editbar.getControls()[0] as Toggle).setActive(true);
    ControlManager.hide([editModeControl, clearMapCtrl]);
  }

  // Add the snap interaction
  const snap = new Snap({
    source: this.vector.getSource(),
  });
  this.map.addInteraction(snap);

  // GeoJSON upload button + dialog
  setUploadControl(this, editbar);
}
