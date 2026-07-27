// src/components/gtt-client/geocoding/registry.ts

/**
 * The result of a geocoder provider factory: the constructed ol-ext Search
 * control and the resolved providerOptions (admin configuration merged with the
 * provider's own defaults). createSearchControl needs the resolved options
 * because the custom button mixin decides whether to render a reverse-geocode
 * button from providerOptions.reverse / providerOptions.reverseTitle.
 */
export interface GeocoderProviderResult {
  control: any;
  providerOptions: any;
}

/**
 * A geocoder provider factory takes the providerOptions from the admin
 * configuration, applies the provider's own defaults, and returns the
 * constructed Search control alongside those resolved options. The control is
 * post-processed by createSearchControl (custom button + handleSelect
 * extension).
 */
export type GeocoderProviderFactory = (providerOptions: any) => GeocoderProviderResult;

const registry = new Map<string, GeocoderProviderFactory>();

/**
 * Registers a geocoder provider under the given name. Registering an existing
 * name overrides the previous factory, which lets host applications swap a
 * built-in provider for their own implementation.
 * @param name - Provider identifier as used in the geocoder configuration.
 * @param factory - Factory creating the Search control for this provider.
 */
export function registerGeocoderProvider(name: string, factory: GeocoderProviderFactory): void {
  registry.set(name, factory);
}

/**
 * Returns the factory registered for the given provider name, or undefined.
 * @param name - Provider identifier.
 */
export function getGeocoderProvider(name: string): GeocoderProviderFactory | undefined {
  return registry.get(name);
}

/**
 * Returns true if a provider is registered under the given name.
 * @param name - Provider identifier.
 */
export function hasGeocoderProvider(name: string): boolean {
  return registry.has(name);
}

/**
 * Returns the names of all registered providers.
 */
export function listGeocoderProviders(): string[] {
  return Array.from(registry.keys());
}
