// src/components/gtt-client/geocoding/providers/google.ts
import SearchGoogle from '../SearchGoogle';
import { registerGeocoderProvider } from '../registry';

registerGeocoderProvider('google', (providerOptions) => {
  const resolved = {
    reverse: true, // Enable reverse geocoding
    ...providerOptions,
  };
  return { control: new SearchGoogle(resolved), providerOptions: resolved };
});
