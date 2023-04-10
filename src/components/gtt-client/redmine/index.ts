import GttClient from '../GttClient';

/**
 * Extend core Redmine's buildFilterRow method
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;
window.buildFilterRow = function (field, operator, values) {
  if (field == 'distance') {
    buildDistanceFilterRow(operator, values);
  } else {
    window.buildFilterRowWithoutDistanceFilter(field, operator, values);
  }
};

export const buildDistanceFilterRow = (operator: any, values: any): void => {
  const field = 'distance'
  const fieldId = field
  const filterTable = document.querySelector('#filters-table') as HTMLTableElement
  const filterOptions = window.availableFilters[field]
  if (!filterOptions) {
    return
  }
  const operators = window.operatorByType[filterOptions['type']]
  const filterValues = filterOptions['values']

  const tr = document.createElement('tr') as HTMLTableRowElement
  tr.className = 'filter'
  tr.id = `tr_${fieldId}`
  tr.innerHTML = `
  <td class="field">
    <input checked="checked" id="cb_${fieldId}" name="f[]" value="${field}" type="checkbox">
    <label for="cb_${fieldId}">${filterOptions['name']}</label>
  </td>
  <td class="operator">
    <select id="operators_${fieldId}" name="op[${field}]">
  </td>
  <td class="values"></td>
  `
  filterTable.appendChild(tr)

  const select = tr.querySelector('td.operator select') as HTMLSelectElement
  for (let i = 0; i < operators.length; i++) {
    const option = document.createElement('option')
    option.value = operators[i]
    option.text = window.operatorLabels[operators[i]]
    if (operators[i] == operator) {
      option.selected = true
    }
    select.append(option)
  }
  select.addEventListener('change', () => {
    window.toggleOperator(field)
  })

  const td = tr.querySelector('td.values') as HTMLTableCellElement
  td.innerHTML = `
  <span style="display:none;">
    <input type="text" name="v[${field}][]" id="values_${fieldId}_1" size="14" class="value" />
  </span>
  <span style="display:none;">
    <input type="text" name="v[${field}][]" id="values_${fieldId}_2" size="14" class="value" />
  </span>
  <input type="hidden" name="v[${field}][]" id="values_${fieldId}_3" />
  <input type="hidden" name="v[${field}][]" id="values_${fieldId}_4" />
  `;
  (document.querySelector(`#values_${fieldId}_1`) as HTMLInputElement).value = values[0]
  let base_idx = 1
  if (values.length == 2 || values.length == 4) {
    // upper bound for 'between' operator
    (document.querySelector(`#values_${fieldId}_2`) as HTMLInputElement).value = values[1]
    base_idx = 2
  }
  let x, y
  if (values.length > 2) {
    // console.log('distance center point from values: ', values[base_idx], values[base_idx+1]);
    x = values[base_idx]
    y = values[base_idx+1]
  } else {
    // console.log('taking distance from map fieldset: ', $('fieldset#location').data('center'));
    const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement
    if (!fieldset.dataset.center) {
      return
    }
    const xy = JSON.parse(fieldset.dataset.center)
    x = xy[0]
    y = xy[1]
  }
  (document.querySelector(`#values_${fieldId}_3`) as HTMLInputElement).value = x;
  (document.querySelector(`#values_${fieldId}_4`) as HTMLInputElement).value = y;
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
