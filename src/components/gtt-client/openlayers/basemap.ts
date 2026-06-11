import { getCookie } from '../helpers';

/**
 * Decide which baselayer to show
 */
export function setBasemap(this: any): void {
  if (this.layerArray.length == 0) {
    const notification = document.createElement('div');
    notification.className = 'gtt-map-notification';
    notification.innerText = this.i18n.messages.baselayer_missing;

    const mapContainer = this.map.getTargetElement();
    Object.assign(mapContainer.style, {
      position: 'relative',
    });

    mapContainer.appendChild(notification);
    return
  }

  let index = 0
  const cookie = parseInt(getCookie('_redmine_gtt_basemap'))
  if (cookie) {
    let lid = 0
    // Check if layer ID exists in available layers
    this.layerArray.forEach((layer: any) => {
      if (cookie === layer.get("lid")) {
        lid = cookie
      }
    })

    // Set selected layer visible
    this.layerArray.forEach((layer: any, idx: number) => {
      if (lid === layer.get("lid")) {
        index = idx
      }
    })
  }

  // Set layer visible
  this.layerArray[index].setVisible(true)
}
