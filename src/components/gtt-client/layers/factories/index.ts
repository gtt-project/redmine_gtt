// src/components/gtt-client/layers/factories/index.ts
//
// Importing this barrel registers all built-in layer factories as a side
// effect. init/layers.ts imports it so factories are registered before the
// first createLayer call (the registry itself cannot import this barrel, as
// the factories import the registry). Host applications can register
// additional factories via registerLayerFactory (see ../registry).
import './ol';
