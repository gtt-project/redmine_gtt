// src/components/gtt-client/geocoding/SearchFactory.ts
import { applyCustomButton } from './CustomButtonMixin';
import SearchGTT from './SearchGTT';
import SearchNominatim from 'ol-ext/control/SearchNominatim';
import SearchPhoton from 'ol-ext/control/SearchPhoton';

export function createSearchControl(options: any): any {
  let searchControl: any;

  console.log(options);

  switch (options.provider) {
    case 'nominatim':
      console.log('Creating Nominatim search control');
      searchControl = new SearchNominatim(options);
      break;
    case 'photon':
      console.log('Creating Photon search control');
      searchControl = new SearchPhoton(options);
      break;
    case 'custom':
      console.log('Creating custom search control');
      searchControl = new SearchGTT(options);
      break;
    // Add cases for other providers as needed
    default:
      console.log('Creating default search control');
      // Todo: Decide default search control
      searchControl = new SearchPhoton(options);
      break;
  }

  // Apply custom button implementation
  console.log('Creating custom button');
  applyCustomButton(searchControl, options);

  return searchControl;
}
