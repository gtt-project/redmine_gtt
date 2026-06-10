import { buildDistanceFilterRow } from './filters';

export { buildDistanceFilterRow, syncSpatialFilters } from './filters';

/**
 * Extend core Redmine's buildFilterRow method so the distance filter gets its
 * custom row (distance bounds + hidden search center).
 *
 * (A replaceIssueFormWith wrapper used to live here to re-create the map
 * after AJAX form reloads, but it was never assigned to the window object.
 * The gtt-map Stimulus controller now reconnects automatically when the map
 * div re-enters the DOM, which covers that case properly.)
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;
window.buildFilterRow = function (field, operator, values) {
  if (field == 'distance') {
    buildDistanceFilterRow(operator, values);
  } else {
    window.buildFilterRowWithoutDistanceFilter(field, operator, values);
  }
};
