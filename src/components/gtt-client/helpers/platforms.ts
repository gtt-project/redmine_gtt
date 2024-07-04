/**
 * Utility function to detect touch devices
 * @param isTouchDevice - boolean
 * @returns boolean
 */
export const isTouchDevice = (): boolean => {
  return ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
}

/**
 * Utility function to detect macOS
 * @param isMacOS - boolean
 * @returns boolean
 */
export const isMacOS = (): boolean => {
  return /Macintosh|MacIntel|MacPPC|Mac68K/.test(navigator.userAgent);
}
