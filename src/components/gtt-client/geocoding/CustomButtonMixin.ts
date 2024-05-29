// src/components/gtt-client/geocoding/CustomButtonMixin.ts
import ol_ext_element from 'ol-ext/util/element';

export function applyCustomButton(searchControl: any, options: any) {
  // Remove the default button if it exists
  const defaultButton = searchControl.element.querySelector('button[type="button"]');
  if (defaultButton) {
    defaultButton.remove();
  }

  // Create a custom button with a custom icon
  searchControl.button = ol_ext_element.create('BUTTON', {
    className: 'ol-search-gtt',
    title: options.title || 'Search',
    html: options.html || '?',
    parent: searchControl.element,
    click: function () {
      searchControl.element.classList.toggle('ol-collapsed');
      if (!searchControl.element.classList.contains('ol-collapsed')) {
        const input = searchControl.element.querySelector('input.search');
        if (input) {
          input.focus();
          searchControl.drawList_();
        }
      }
    }.bind(searchControl)
  }) as HTMLButtonElement;

  // Move list to the end
  const ul = searchControl.element.querySelector("ul.autocomplete");
  if (ul) {
    searchControl.element.appendChild(ul);
  }
}
