// src/components/gtt-client/geocoding/providers/nominatim.ts
import SearchNominatim from 'ol-ext/control/SearchNominatim';
import { registerGeocoderProvider } from '../registry';

registerGeocoderProvider('nominatim', (providerOptions) => {
  const resolved = {
    reverse: true, // Enable reverse geocoding
    typing: -1, // Disable typing delay (see Nominatim policy!)
    ...providerOptions,
  };
  return { control: new SearchNominatim(resolved), providerOptions: resolved };
});
