// src/components/gtt-client/geocoding/SearchFactory.ts
import { Feature } from 'ol';
import { applyCustomButton } from './CustomButtonMixin';
import { getGeocoderProvider, listGeocoderProviders } from './registry';
// Side-effect import: registers all built-in geocoder providers.
import './providers';

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
export function createSearchControl(options: any, handleSelectCallback: (response: object) => void): any {
  // Look up the provider factory in the registry. Built-in providers are
  // registered via the './providers' side-effect import above; host
  // applications can add more with registerGeocoderProvider.
  const factory = getGeocoderProvider(options.provider);
  if (!factory) {
    throw new Error(
      `Unsupported provider: ${options.provider}. Registered providers: ${listGeocoderProviders().join(', ')}`
    );
  }

  const { control: searchControl, providerOptions } = factory(options.providerOptions ?? {});

  // Apply custom button implementation. Pass the resolved providerOptions so the
  // reverse-button decision sees the provider defaults (e.g. reverse: true), not
  // just the raw admin configuration.
  applyCustomButton(searchControl, { ...options, providerOptions });

  // Extend the handleSelect function with the custom callback
  extendHandleSelect(searchControl, handleSelectCallback);

  return searchControl;
}
