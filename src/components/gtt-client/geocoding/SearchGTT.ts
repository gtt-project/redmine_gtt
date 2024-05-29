// src/components/gtt-client/geocoding/SearchGTT.ts
import Search, { Options as SearchOptions } from 'ol-ext/control/Search';
import ol_ext_element from 'ol-ext/util/element';

interface SearchGTTOptions extends SearchOptions {
  // Additional options
  html?: string;
  provider?: string;
  providerOptions?: object;
}

class SearchGTT extends Search {
  private button: HTMLButtonElement;

  constructor(options: SearchGTTOptions = {}) {
    options = options || {};
    options.className = options.className || 'ol-search-gtt';
    options.html = options.html || '?';

    options.provider = options.provider || '';
    options.providerOptions = options.providerOptions || {};

    super(options);

    // Remove the default button if it exists
    const defaultButton = this.element.querySelector('button[type="button"]');
    if (defaultButton) {
      defaultButton.remove();
    }

    // Create a custom button with a custom icon
    this.button = ol_ext_element.create('BUTTON', {
      className: 'ol-search-gtt',
      title: options.title || 'Search',
      html: options.html,
      parent: this.element,
      click: function () {
        this.element.classList.toggle('ol-collapsed');
        if (!this.element.classList.contains('ol-collapsed')) {
          const input = this.element.querySelector('input.search');
          if (input) {
            input.focus();
            this.drawList_();
          }
        }
      }.bind(this)
    }) as HTMLButtonElement;

    // Move list to the end
    const ul = this.element.querySelector("ul.autocomplete");
    if (ul) {
      this.element.appendChild(ul);
    }
  }
}

export default SearchGTT;
