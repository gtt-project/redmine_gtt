import { transform, transformExtent } from 'ol/proj';

/**
 * Integration of the gtt spatial filters (distance, bbox) with Redmine's
 * issue filter UI.
 */

// Default operator for new Distance filter rows: "within N meters". The
// generic float default '=' would mean "exactly N meters away", which
// practically never matches anything (#364).
const DEFAULT_DISTANCE_OPERATOR = '<=';

// Meters per display unit, mirroring RedmineGtt::DistanceUnit (#10). The
// wire format (submitted filter values) and the API stay meters; only what
// the user sees and types in the filter row is converted.
export const METERS_PER_UNIT: Record<string, number> = {
  m: 1,
  km: 1000,
  ft: 0.3048,
  mi: 1609.344,
  nm: 1852,
};

function distanceUnit(): { unit: string; factor: number } {
  let unit = 'm';
  try {
    const defaults = document.getElementById('gtt-defaults');
    const settings = JSON.parse(defaults?.dataset.pluginSettings ?? '{}');
    if (METERS_PER_UNIT[settings.distance_unit]) {
      unit = settings.distance_unit;
    }
  } catch {
    // stay on meters when the settings payload is missing or malformed
  }
  return { unit, factor: METERS_PER_UNIT[unit] };
}

export function metersToUnitValue(meters: string, factor: number): string {
  const value = parseFloat(meters);
  if (!isFinite(value)) {
    return meters ?? '';
  }
  // toFixed keeps converted round-trips readable (no 24.999999997)
  return String(parseFloat((value / factor).toFixed(6)));
}

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
        <input type="text" name="v[${field}][]" id="values_${field}_1" size="14" class="value"> ${distanceUnit().unit}
      </span>
      <span style="display:none;">
        <input type="text" name="v[${field}][]" id="values_${field}_2" size="14" class="value"> ${distanceUnit().unit}
      </span>
      <input type="hidden" name="v[${field}][]" id="values_${field}_3">
      <input type="hidden" name="v[${field}][]" id="values_${field}_4">
    </div>
  `;
  filterTable.appendChild(row);

  appendOperatorOptions(row, field, operator || DEFAULT_DISTANCE_OPERATOR, filterOptions['type']);
  fillDistanceValues(row, values);
  convertDistanceInputOnSubmit();
}

/**
 * The distance bounds are displayed and edited in the configured unit but
 * submitted in meters (#10). Converting just before submit keeps the wire
 * format and saved queries metric. Core submits #query_form through
 * jQuery ($('#query_form').submit()), which triggers jQuery-bound handlers
 * but bypasses native listeners, so the hook binds via jQuery when present.
 */
function convertDistanceInputOnSubmit(): void {
  const form = document.querySelector('#query_form') as HTMLFormElement | null;
  if (!form || form.dataset.gttDistanceUnitHook) {
    return;
  }
  form.dataset.gttDistanceUnitHook = '1';

  const convert = () => {
    const { factor } = distanceUnit();
    if (factor === 1) {
      return;
    }
    for (const n of [1, 2]) {
      const input = document.querySelector(`#values_distance_${n}`) as HTMLInputElement | null;
      if (input && !input.disabled && input.value.trim() !== '') {
        const value = parseFloat(input.value);
        if (isFinite(value)) {
          // Submit whole meters, rounded to nearest: 0.5 mi is 804.672 m
          // and should become 805, not 804. The server's to_i then leaves
          // the already-integral value unchanged.
          input.value = String(Math.round(value * factor));
        }
      }
    }
  };

  if (typeof $ !== 'undefined') {
    $(form).on('submit', convert);
  } else {
    form.addEventListener('submit', convert);
  }
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
  const { factor } = distanceUnit();

  // submitted/saved values are meters; display them in the configured unit
  input(1).value = metersToUnitValue(values[0] ?? '', factor);
  let baseIdx = 1;
  if (values.length === 2 || values.length === 4) {
    // upper bound for the 'between' operator
    input(2).value = metersToUnitValue(values[1], factor);
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
