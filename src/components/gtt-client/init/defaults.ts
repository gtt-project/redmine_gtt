import { constants } from '../constants';
import { IFilterOption } from '../interfaces';

/**
 * Initializes default settings by retrieving the dataset from the element with the
 * ID 'gtt-defaults'. If the dataset doesn't have a value for a property, a default
 * value from the 'constants' object is used.
 * @returns - An object containing the initialized default settings.
 */
export function initDefaults(): DOMStringMap {
  const gtt_defaults = document.querySelector('#gtt-defaults') as HTMLDivElement;
  if (!gtt_defaults) {
    return {};
  }

  const defaults = gtt_defaults.dataset;

  // Set default values for missing properties
  Object.entries(constants).forEach(([key, value]) => {
    if (!defaults[key]) {
      defaults[key] = value.toString();
    }
  });

  return defaults;
}

/**
 * Initializes filter options with default values.
 * @returns - An object containing the initialized filter options.
 */
export function initFilters(): IFilterOption {
  return { location: false, distance: false };
}
