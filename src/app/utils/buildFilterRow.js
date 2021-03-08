/**
 * Extend core Redmine's buildFilterRow method
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;

window.buildFilterRow = function (field, operator, values) {
  if (field == 'distance') {
    buildDistanceFilterRow(operator, values);
  } else {
    buildFilterRowWithoutDistanceFilter(field, operator, values);
  }
};

function buildDistanceFilterRow(operator, values) {
  var field = 'distance';
  var fieldId = field;
  var filterTable = $("#filters-table");
  var filterOptions = availableFilters[field];
  if (!filterOptions) return;
  var operators = operatorByType[filterOptions['type']];
  var filterValues = filterOptions['values'];
  var i, select;

  var tr = $('<tr class="filter">').attr('id', 'tr_' + fieldId).html(
    '<td class="field"><input checked="checked" id="cb_' + fieldId + '" name="f[]" value="' + field + '" type="checkbox"><label for="cb_' + fieldId + '"> ' + filterOptions['name'] + '</label></td>' +
    '<td class="operator"><select id="operators_' + fieldId + '" name="op[' + field + ']"></td>' +
    '<td class="values"></td>'
  );
  filterTable.append(tr);

  select = tr.find('td.operator select');
  for (i = 0; i < operators.length; i++) {
    var option = $('<option>').val(operators[i]).text(operatorLabels[operators[i]]);
    if (operators[i] == operator) {
      option.attr('selected', true);
    }
    select.append(option);
  }
  select.change(function () {
    toggleOperator(field);
  });

  tr.find('td.values').append(
    '<span style="display:none;"><input type="text" name="v[' + field + '][]" id="values_' + fieldId + '_1" size="14" class="value" /></span>' +
    '<span style="display:none;"><input type="text" name="v[' + field + '][]" id="values_' + fieldId + '_2" size="14" class="value" /></span>' +
    '<input type="hidden" name="v[' + field + '][]" id="values_' + fieldId + '_3" />' +
    '<input type="hidden" name="v[' + field + '][]" id="values_' + fieldId + '_4" />'
  );
  $('#values_' + fieldId + '_1').val(values[0]);
  var base_idx = 1;
  if (values.length == 2 || values.length == 4) {
    // upper bound for 'between' operator
    $('#values_' + fieldId + '_2').val(values[1]);
    base_idx = 2;
  }
  var x, y;
  if (values.length > 2) {
    // console.log('distance center point from values: ', values[base_idx], values[base_idx+1]);
    x = values[base_idx];
    y = values[base_idx + 1];
  } else {
    // console.log('taking distance from map fieldset: ', $('fieldset#location').data('center'));
    var xy = $('fieldset#location').data('center');
    x = xy[0];
    y = xy[1];
  }
  $('#values_' + fieldId + '_3').val(x);
  $('#values_' + fieldId + '_4').val(y);
}
