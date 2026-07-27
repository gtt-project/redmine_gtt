// src/components/gtt-client/events/index.ts
//
// Public surface of the GttClient event bus. Re-exported from the gtt-client
// barrel so consumers can `import { GttEvent, GttEventBus } from '.../gtt-client'`.
export { GttEventBus } from './bus';
export { GttEvent } from './types';
export type { GttEventName, GttEventMap } from './types';
