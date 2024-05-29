// src/components/gtt-client/geocoding/SearchGTT.ts
import Search, { Options as SearchOptions } from 'ol-ext/control/Search';

interface SearchGTTOptions extends SearchOptions {
  // Add custom options here
}

class SearchGTT extends Search {
  public button: HTMLButtonElement;

  constructor(options: SearchGTTOptions = {}) {
    options = options || {};
    options.className = options.className || 'ol-search-gtt';

    super(options);
  }
}

export default SearchGTT;
