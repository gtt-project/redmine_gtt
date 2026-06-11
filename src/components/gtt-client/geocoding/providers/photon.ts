// src/components/gtt-client/geocoding/providers/photon.ts
import SearchPhoton from 'ol-ext/control/SearchPhoton';
import { registerGeocoderProvider } from '../registry';

registerGeocoderProvider('photon', (providerOptions) => {
  const resolved = {
    // lang: 'en', // Force preferred language
    reverse: true, // Enable reverse geocoding
    position: true, // Priority to position
    ...providerOptions,
  };
  return { control: new SearchPhoton(resolved), providerOptions: resolved };
});
