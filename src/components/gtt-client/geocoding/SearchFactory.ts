// src/components/gtt-client/geocoding/SearchFactory.ts
import { Feature } from 'ol';
import { applyCustomButton } from './CustomButtonMixin';
import SearchGTT from './SearchGTT';
import SearchGoogle from './SearchGoogle';
import SearchNominatim from 'ol-ext/control/SearchNominatim';
import SearchPhoton from 'ol-ext/control/SearchPhoton';

/**
 * Function signature for the handleSelect function.
 * @param feature - The selected feature.
 * @param reverse - Whether the feature was selected in reverse mode.
 * @param options - Additional options.
 * @returns void
 */
type HandleSelectFunction = (
  feature: Feature,
  reverse: boolean,
  options?: any
) => void;

/**
 * Custom callback for the handleSelect function.
 * @param searchControl
 * @param handleSelectCallback
 * @returns void
 */
function extendHandleSelect(searchControl: any, handleSelectCallback: (response: object) => void): void {
  const originalHandleSelect: HandleSelectFunction = searchControl._handleSelect.bind(searchControl);
  searchControl._handleSelect = (feature: Feature, reverse: boolean, options?: any): void => {
    originalHandleSelect(feature, reverse, options);
    handleSelectCallback({
      'title': searchControl.getTitle(feature),
      'reverse': reverse ? true : false,
      // Add any other additional keys here
    });
  };
}

/**
 * Creates a search control instance based on the provider.
 * @param options
 * @param handleSelectCallback - Custom callback function to handle the selected feature.
 * @returns
 */
export function createSearchControl(options: any, handleSelectCallback: (feature: Feature) => void): any {
  let searchControl: any;

  // Create search control instance based on the provider
  switch (options.provider) {
    // Apply settings for Nomatim provider
    case 'nominatim':
      options.providerOptions = {
        reverse: true, // Enable reverse geocoding
        typing: -1, // Disable typing delay (see Nominatim policy!)
        ...options.providerOptions,
      };
      searchControl = new SearchNominatim(options.providerOptions);
      break;
    // Apply settings for Photon provider
    case 'photon':
      options.providerOptions = {
        // lang: 'en', // Force preferred language
        reverse: true, // Enable reverse geocoding
        position: true, // Priority to position
        ...options.providerOptions,
      };
      searchControl = new SearchPhoton(options.providerOptions);
      break;
    // Apply settings for Google provider
    case 'google':
      options.providerOptions = {
        reverse: true, // Enable reverse geocoding
        ...options.providerOptions,
      };
      searchControl = new SearchGoogle(options.providerOptions);
      break;

    case 'custom':
      options.providerOptions = {
        ...options.providerOptions,
      };
      searchControl = new SearchGTT(options.providerOptions);
      break;
    // Add cases for new providers here
    default:
      // Throw an error if the provider is not supported
      throw new Error(`Unsupported provider: ${options.provider}`);
      break;
  }

  // Apply custom button implementation
  applyCustomButton(searchControl, options);

  // Extend the handleSelect function with the custom callback
  extendHandleSelect(searchControl, handleSelectCallback);

  return searchControl;
}
