import { Map } from 'ol';
import { defaults as interactions_defaults, MouseWheelZoom } from 'ol/interaction';
import { focus as events_condifition_focus } from 'ol/events/condition';
import { defaults as control_defaults } from 'ol/control';

export function initMap(target: HTMLElement, i18n: any): Map {
  const map = new Map({
    target,
    interactions: interactions_defaults({ mouseWheelZoom: false }).extend([
      new MouseWheelZoom({
        constrainResolution: true, // force zooming to a integer zoom
        condition: events_condifition_focus, // only wheel/trackpad zoom when the map has the focus
      }),
    ]),
    controls: control_defaults({
      rotateOptions: {},
      attributionOptions: {
        collapsible: false,
      },
      zoomOptions: {
        zoomInTipLabel: i18n.control.zoom_in,
        zoomOutTipLabel: i18n.control.zoom_out,
      },
    }),
  });

  return map;
}
