import { constants } from '../constants';

export function initDefaults(): DOMStringMap {
  const gtt_defaults = document.querySelector('#gtt-defaults') as HTMLDivElement;
  if (!gtt_defaults) {
    return {};
  }

  const defaults = gtt_defaults.dataset;

  // Set default values for missing properties
  Object.entries(constants).forEach(([key, value]) => {
    if (defaults[key] === null || defaults[key] === undefined) {
      defaults[key] = value.toString();
    }
  });

  return defaults;
}
