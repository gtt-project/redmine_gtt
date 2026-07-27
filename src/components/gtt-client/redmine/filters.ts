import { transform, transformExtent } from 'ol/proj';

/**
 * Integration of the gtt spatial filters (distance, bbox) with Redmine's
 * issue filter UI.
 */

// Default operator for new Distance filter rows: "within N meters". The
// generic float default '=' would mean "exactly N meters away", which
// practically never matches anything (#364).
const DEFAULT_DISTANCE_OPERATOR = '<=';

/**
 * Builds the filter row for the distance filter, mirroring the div-based
 * markup of Redmine 6.x core's buildFilterRow (application-legacy.js).
 *
 * The two text inputs hold the distance bounds, the two hidden inputs the
 * search center (lng, lat in WGS84). Input visibility is managed by core's
 * toggleOperator, like for any other filter row.
 */
export function buildDistanceFilterRow(operator: string, values: string[]): void {
  const field = 'distance';
  const filterTable = document.querySelector('#filters-table');
  const filterOptions = window.availableFilters[field];
  if (!filterTable || !filterOptions) {
    return;
  }

  const row = document.createElement('div');
  row.className = 'filter';
  row.id = `tr_${field}`;
  row.innerHTML = `
    <div class="field">
      <input checked="checked" id="cb_${field}" name="f[]" value="${field}" type="checkbox">
      <label for="cb_${field}"> ${filterOptions['name']}</label>
    </div>
    <div class="operator">
      <select id="operators_${field}" name="op[${field}]"></select>
    </div>
    <div class="values">
      <span style="display:none;">
        <input type="text" name="v[${field}][]" id="values_${field}_1" size="14" class="value">
      </span>
      <span style="display:none;">
        <input type="text" name="v[${field}][]" id="values_${field}_2" size="14" class="value">
      </span>
      <input type="hidden" name="v[${field}][]" id="values_${field}_3">
      <input type="hidden" name="v[${field}][]" id="values_${field}_4">
    </div>
  `;
  filterTable.appendChild(row);

  appendOperatorOptions(row, field, operator || DEFAULT_DISTANCE_OPERATOR, filterOptions['type']);
  fillDistanceValues(row, values);
}

function appendOperatorOptions(row: HTMLElement, field: string, selectedOperator: string, filterType: string): void {
  const select = row.querySelector('.operator select') as HTMLSelectElement;
  for (const op of window.operatorByType[filterType]) {
    const option = document.createElement('option');
    option.value = op;
    option.text = window.operatorLabels[op];
    option.selected = op === selectedOperator;
    select.append(option);
  }
  select.addEventListener('change', () => {
    window.toggleOperator(field);
  });
}

function fillDistanceValues(row: HTMLElement, values: string[]): void {
  const input = (n: number) => row.querySelector(`#values_distance_${n}`) as HTMLInputElement;

  input(1).value = values[0] ?? '';
  let baseIdx = 1;
  if (values.length === 2 || values.length === 4) {
    // upper bound for the 'between' operator
    input(2).value = values[1];
    baseIdx = 2;
  }

  // Search center: restore it from the submitted values; for a freshly added
  // filter fall back to the current map center published by the map (#365).
  let center: [string, string] | null = null;
  if (values.length > 2) {
    center = [values[baseIdx], values[baseIdx + 1]];
  } else {
    const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement | null;
    if (fieldset?.dataset.center) {
      const [x, y] = JSON.parse(fieldset.dataset.center);
      center = [String(x), String(y)];
    }
  }
  if (center) {
    input(3).value = center[0];
    input(4).value = center[1];
  }
}

/**
 * Pushes the current map view into the spatial filters. Bound to the map's
 * moveend event.
 */
export function syncSpatialFilters(this: any): void {
  const view = this.map.getView();
  const center = transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326');
  const extent = transformExtent(view.calculateExtent(this.map.getSize()), 'EPSG:3857', 'EPSG:4326');
  // The server parses pipe-separated WGS84 coordinates (#363).
  const extentValue = extent.join('|');

  // Remember the center for distance filter rows added later.
  const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement | null;
  if (fieldset) {
    fieldset.dataset.center = JSON.stringify(center);
  }

  // Update the center of an existing distance filter row only after the user
  // actually moved the map: moveend also fires for the programmatic fits
  // during page setup, which must not overwrite a submitted center (#365).
  if (this.userMovedMap) {
    const lng = document.querySelector('#tr_distance #values_distance_3') as HTMLInputElement | null;
    const lat = document.querySelector('#tr_distance #values_distance_4') as HTMLInputElement | null;
    if (lng) lng.value = String(center[0]);
    if (lat) lat.value = String(center[1]);
  }

  // 'On map' means "the current view" by definition, so the bbox always
  // follows the map: in the rendered row...
  const bboxOption = document.querySelector('select[name="v[bbox][]"] option') as HTMLOptionElement | null;
  if (bboxOption) {
    bboxOption.value = extentValue;
  }
  // ...and in the data core Redmine uses to build the row when the filter is
  // added after the map was moved. This used to store the raw EPSG:3857
  // extent array, which the server cannot parse (#363).
  if (window.availableFilters?.bbox) {
    window.availableFilters.bbox.values = [['On map', extentValue]];
  }
}
