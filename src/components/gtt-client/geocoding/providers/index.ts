// src/components/gtt-client/geocoding/providers/index.ts
//
// Importing this barrel registers all built-in geocoder providers as a side
// effect. SearchFactory imports it so the registry is populated before the
// first createSearchControl call. Host applications can register additional
// providers via registerGeocoderProvider (see ../registry).
import './nominatim';
import './photon';
import './google';
import './custom';
