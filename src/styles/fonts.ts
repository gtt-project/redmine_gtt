import { fontPromise as customIcons } from './icons/custom/custom-icons-def';
import { fontPromise as materialIcons } from './icons/material-design/material-design-def';

/**
 * Resolves when both icon fonts (custom + Material Design) are loaded and
 * their FontSymbol definitions are registered. Map features and icon pickers
 * draw font glyphs, so they wait for this before rendering.
 */
export function fontsReady(): Promise<unknown> {
  return Promise.all([customIcons, materialIcons]);
}
