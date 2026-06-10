import GttClient from '../GttClient';
import { buildDistanceFilterRow } from './filters';

export { buildDistanceFilterRow, syncSpatialFilters } from './filters';

/**
 * Extend core Redmine's buildFilterRow method so the distance filter gets its
 * custom row (distance bounds + hidden search center).
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;
window.buildFilterRow = function (field, operator, values) {
  if (field == 'distance') {
    buildDistanceFilterRow(operator, values);
  } else {
    window.buildFilterRowWithoutDistanceFilter(field, operator, values);
  }
};

window.replaceIssueFormWithInitMap = window.replaceIssueFormWith;
export const replaceIssueFormWithInitMap = window.replaceIssueFormWith;

export const replaceIssueFormWith = (html: any): void => {
  window.replaceIssueFormWithInitMap(html);
  const ol_maps = document.querySelector(
    "form[class$='_issue'] div.ol-map"
  ) as HTMLDivElement;
  if (ol_maps) {
    new GttClient({ target: ol_maps });
  }
};
