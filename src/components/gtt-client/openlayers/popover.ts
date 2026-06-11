import { Select } from 'ol/interaction';
import PopupFeature from 'ol-ext/overlay/PopupFeature';

import { icons, buttonIcon } from '../icons';

/**
 * Add popup
 */
export function setPopover(this: any): void {

  // Control Select
  const select = new Select({
    layers: [this.vector],
    style: null,
    multi: false,
    hitTolerance: 5
  });
  this.map.addInteraction(select);

  // Popup overlay
  const popup = new PopupFeature({
    popupClass: 'default',
    select: select,
    canFix: false,
    closeBox: false,
    positioning: 'auto',
    maxChar: 30,
    template: {
      title: (ftr: any) => {
        const popup_contents = JSON.parse(this.contents.popup);
        const subject = String(ftr.get('subject') ?? '');
        const displaySubject = subject.length > 25 ? `${subject.substring(0, 22)}…` : subject;

        const replacePlaceholders = (str: string, replacement: string): string => {
          return str.split('[').map(part => {
            const endIndex = part.indexOf(']');
            if (endIndex !== -1) {
              return replacement + part.substring(endIndex + 1);
            }
            return part;
          }).join('');
        };

        // The subject is user-controlled issue data: escape it (and the url)
        // before interpolating into the popup HTML. The subject doubles as
        // the accessible name of the icon-only link.
        const escapeHtml = (text: string): string => {
          const div = document.createElement('div');
          div.textContent = text;
          return div.innerHTML.replace(/"/g, '&quot;');
        };

        const url = replacePlaceholders(popup_contents.href, String(ftr.get('id')));
        return `${escapeHtml(displaySubject)} <a href="${escapeHtml(url)}" aria-label="${escapeHtml(subject)}" title="${escapeHtml(subject)}">${buttonIcon(icons.popupLink)}</a>`;
        },
      attributes: {}
    }
  });
  this.map.addOverlay(popup);

  // Change mouse cursor when over marker
  this.map.on('pointermove', (evt: any) => {
    if (evt.dragging) return;
    const hit = this.map.hasFeatureAtPixel(evt.pixel, {
      layerFilter: (layer: any) => {
        return layer === this.vector;
      }
    });
    this.map.getTargetElement().style.cursor = hit ? 'pointer' : '';
  });
}
