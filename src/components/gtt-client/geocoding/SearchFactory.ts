// src/components/gtt-client/geocoding/SearchFactory.ts
import { applyCustomButton } from './CustomButtonMixin';
import SearchGTT from './SearchGTT';
import SearchGoogle from './SearchGoogle';
import SearchNominatim from 'ol-ext/control/SearchNominatim';
import SearchPhoton from 'ol-ext/control/SearchPhoton';

export function createSearchControl(options: any): any {
  let searchControl: any;

  // Create search control instance based on the provider
  switch (options.provider) {
    case 'nominatim':
      searchControl = new SearchNominatim({
        ...options.providerOptions,
      });
      break;
    case 'photon':
      searchControl = new SearchPhoton({
        ...options.providerOptions,
      });
      break;
    case 'google':
      searchControl = new SearchGoogle({
        ...options.providerOptions,
      });
      break;
    case 'custom':
      searchControl = new SearchGTT({
        ...options.providerOptions,
      });
      break;
    // Add cases for other providers as needed
    default:
      searchControl = new SearchPhoton({
        ...options.providerOptions,
      });
      break;
  }

  // Apply custom button implementation
  applyCustomButton(searchControl, options);

  return searchControl;
}
