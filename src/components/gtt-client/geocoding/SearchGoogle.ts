import { transform as ol_proj_transform } from 'ol/proj.js';
import SearchJSON, { Options as SearchOptions } from 'ol-ext/control/SearchJSON.js';
import BaseEvent from 'ol/events/Event';

/**
 * @typedef {Object} SearchGoogleOptions
 * @property {string} apiKey Google API key
 * @property {string} [language] language code
 * @property {string} [region] region code, specified as a ccTLD
 * @property {string} [components] specifies the component restrictions (only Geocoding)
 * @property {string} [result_type] filter the results to match a specific type (only Reverse Geocoding)
 * @property {string} [location_type] filter the results to match a specific location type (only Reverse Geocoding)
 */
interface SearchGoogleOptions extends SearchOptions {
  apiKey: string;
  language?: string;
  region?: string;
  components?: string;
  result_type?: string;
  location_type?: string;
}

/**
 * Search event
 */
export class SearchEvent extends BaseEvent {
  public search: any;
  public coordinate: any[];

  constructor(type: string, search: any, coordinate: any[]) {
    super(type);
    this.search = search;
    this.coordinate = coordinate;
  }
}

/**
 * Search places using the Google Geocoding API.
 *
 * @constructor
 * @extends {SearchJSON}
 * @fires select
 * @param {Object=} options Control options.
 *  @param {string} options.className control class name
 *  @param {Element | string | undefined} options.target Specify a target if you want the control to be rendered outside of the map's viewport.
 *  @param {string | undefined} options.title Title to use for the search button tooltip, default "Search"
 *  @param {string | undefined} options.reverseTitle Title to use for the reverse geocoding button tooltip, default "Click on the map..."
 *  @param {string | undefined} options.placeholder placeholder, default "Search..."
 *  @param {number | undefined} options.typing a delay on each typing to start searching (ms), default 1000.
 *  @param {integer | undefined} options.minLength minimum length to start searching, default 3
 *  @param {integer | undefined} options.maxItems maximum number of items to display in the autocomplete list, default 10
 *  @param {function | undefined} options.handleResponse Handle server response to pass the features array to the list
 *  @param {string | undefined} options.apiKey Google API key (required)
 *  @param {string | undefined} options.language language code
 *  @param {string | undefined} options.region region code, specified as a ccTLD
 *  @param {string | undefined} options.components specifies the component restrictions (only Geocoding)
 *  @param {string | undefined} options.result_type filter the results to match a specific type (only Reverse Geocoding)
 *  @param {string | undefined} options.location_type filter the results to match a specific location type (only Reverse Geocoding)
 */
class SearchGoogle extends SearchJSON {
  constructor(options: SearchGoogleOptions = { apiKey: null }) {
    options.className = options.className || 'google';
    options.url = options.url || 'https://maps.googleapis.com/maps/api/geocode/json';
    super(options);

    if (!options.apiKey) {
      throw new Error('Google Geocoding API requires an API key');
    }

    this.set('apiKey', options.apiKey);

    if (options.language) {
      this.set('language', options.language);
    }
    if (options.region) {
      this.set('region', options.region);
    }
    if (options.components) {
      this.set('components', options.components);
    }
    if (options.result_type) {
      this.set('result_type', options.result_type);
    }
    if (options.location_type) {
      this.set('location_type', options.location_type);
    }
  }

  /** Returns the text to be displayed in the menu
   *  @param {any} f the feature
   *  @return {string} the text to be displayed in the index
   *  @api
   */
  getTitle(f: any) {
    return f.formatted_address;
  }

  /**
   * @param {string} s the search string
   *  @return {Object} request data (as key:value)
   *  @api
   */
  requestData(s: string) {
    const data: Record<string, string> = {
      address: s,
      key: this.get('apiKey'),
    };

    const language = this.get('language');
    if (language) {
      data.language = language;
    }

    const region = this.get('region');
    if (region) {
      data.region = region;
    }

    const components = this.get('components');
    if (components) {
      data.components = components;
    }

    return data;
  }

  /**
   * Handle server response to pass the features array to the list
   * @param {any} response server response
   * @return {Array<google.maps.GeocoderResult>} an array of feature
   */
  handleResponse(response: any): google.maps.GeocoderResult[] {
    return response.results;
  }

  /** A line has been clicked in the menu > dispatch event
   *  @param {google.maps.GeocoderResult} f the feature, as passed in the autocomplete
   *  @api
   */
  select(f: any) {
    var c = [f.geometry.location.lng, f.geometry.location.lat];
    // Add coordinate to the event
    try {
      c = ol_proj_transform(c, 'EPSG:4326', this.getMap().getView().getProjection());
    } catch (e) { /* ok */ }
    this.dispatchEvent(new SearchEvent("select", f, c));
  }

  /** Reverse geocode
   *  @param {ol.coordinate} coord
   *  @api
   */
  reverseGeocode(coord: any, cback: (results: google.maps.GeocoderResult[]) => void) {
    const lonlat = ol_proj_transform(coord, this.getMap().getView().getProjection(), 'EPSG:4326');
    const baseUrl = this.get('url');

    // Manually construct the query parameters to avoid double encoding the comma
    let url = `${baseUrl}?latlng=${lonlat[1]},${lonlat[0]}&key=${this.get('apiKey')}`;

    const language = this.get('language');
    if (language) {
      url += `&language=${encodeURIComponent(language)}`;
    }

    const region = this.get('region');
    if (region) {
      url += `&region=${encodeURIComponent(region)}`;
    }

    const result_type = this.get('result_type');
    if (result_type) {
      url += `&result_type=${encodeURIComponent(result_type)}`;
    }

    const location_type = this.get('location_type');
    if (location_type) {
      url += `&location_type=${encodeURIComponent(location_type)}`;
    }

    this.ajax(
      url,
      {},
      function (resp: any) {
        if (cback) {
          cback.call(this, resp.results);
        } else {
          if (resp && !resp.error) {
            this._handleSelect(resp.results[0], true);
          }
        }
      }.bind(this),
      {}
    );
  }

}

export default SearchGoogle;
