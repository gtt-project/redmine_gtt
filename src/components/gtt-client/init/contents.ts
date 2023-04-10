/**
 * Retrieves the dataset of the given target HTMLElement.
 * @param target - The HTMLElement for which the dataset will be returned.
 * @returns - The dataset of the given target HTMLElement.
 */
export function initContents(target: HTMLElement): DOMStringMap {
  return target.dataset;
}

/**
 * Sets the tabindex attribute of the given target HTMLElement to '0' if it's not already set.
 * @param target - The HTMLElement for which the tabindex attribute will be set.
 */
export function setTabIndex(target: HTMLElement): void {
  if (target.getAttribute('tabindex') === null) {
    target.setAttribute('tabindex', '0');
  }
}
