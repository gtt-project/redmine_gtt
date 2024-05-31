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
    // Apply settings for Nomatim provider
    case 'nominatim':
      searchControl = new SearchNominatim({
        // polygon: true,
        reverse: true, // Enable reverse geocoding
        position: true, // Priority to position
        ...options.providerOptions,
      });
      break;
    // Apply settings for Photon provider
    case 'photon':
      searchControl = new SearchPhoton({
        // lang: 'en', // Force preferred language
        reverse: true, // Enable reverse geocoding
        position: true, // Priority to position
        ...options.providerOptions,
      });
      break;
    // Apply settings for Google provider
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
    // Add cases for new providers here
    default:
      // Throw an error if the provider is not supported
      throw new Error(`Unsupported provider: ${options.provider}`);
      break;
  }

  // Apply custom button implementation
  applyCustomButton(searchControl, options);

  return searchControl;
}
