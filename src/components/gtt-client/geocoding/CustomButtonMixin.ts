import ol_ext_element from 'ol-ext/util/element';

export function applyCustomButton(searchControl: any, options: any) {
  // Remove the default button if it exists
  const defaultButton = searchControl.element.querySelector('button[type="button"]');
  if (defaultButton) {
    defaultButton.remove();
  }

  // Create a custom search button with a custom icon
  searchControl.button = ol_ext_element.create('BUTTON', {
    className: 'ol-search-gtt',
    title: options.title || 'Search',
    html: options.html || '<i class="mdi mdi-map-search-outline"></i>',
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

  // Handle the reverse button if reverse geocoding is enabled
  if (options.providerOptions.reverse) {
    // Remove the default reverse button if it exists
    const defaultReverseButton = searchControl.element.querySelector('button.ol-revers');
    if (defaultReverseButton) {
      defaultReverseButton.remove();
    }

    // Create a custom reverse button with a custom icon
    searchControl.reverseButton = ol_ext_element.create('BUTTON', {
      className: 'ol-search-gtt-reverse ol-revers',
      title: options.providerOptions.reverseTitle || 'Click on the map',
      html: options.html_reverse || 'X',
      parent: searchControl.element,
      click: function () {
        if (!searchControl.get('reverse')) {
          searchControl.set('reverse', !searchControl.get('reverse'));
          const input = searchControl.element.querySelector('input.search');
          if (input) {
            input.focus();
            searchControl.element.classList.add('ol-revers');
          }
        } else {
          searchControl.set('reverse', false);
        }
      }.bind(searchControl)
    }) as HTMLButtonElement;
  }

  // Move list to the end
  const ul = searchControl.element.querySelector("ul.autocomplete");
  if (ul) {
    searchControl.element.appendChild(ul);
  }
}
