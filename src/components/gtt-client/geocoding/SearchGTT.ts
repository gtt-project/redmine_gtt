// src/components/gtt-client/geocoding/SearchGTT.ts
import Search, { Options as SearchOptions } from 'ol-ext/control/Search';

interface SearchGTTOptions extends SearchOptions {
  html?: string;
  provider?: string;
  providerOptions?: object;
}

class SearchGTT extends Search {
  public button: HTMLButtonElement;

  constructor(options: SearchGTTOptions = {}) {
    options = options || {};
    options.className = options.className || 'ol-search-gtt';
    options.html = options.html || '?';

    options.provider = options.provider || '';
    options.providerOptions = options.providerOptions || {};

    super(options);
  }
}

export default SearchGTT;
