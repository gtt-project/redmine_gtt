// src/components/gtt-client/geocoding/providers/custom.ts
import SearchGTT from '../SearchGTT';
import { registerGeocoderProvider } from '../registry';

registerGeocoderProvider('custom', (providerOptions) => {
  const resolved = { ...providerOptions };
  return { control: new SearchGTT(resolved), providerOptions: resolved };
});
