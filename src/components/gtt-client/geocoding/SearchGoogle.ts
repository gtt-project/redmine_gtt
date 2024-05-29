import { transform as ol_proj_transform } from 'ol/proj.js';
import SearchJSON, { Options as SearchOptions } from 'ol-ext/control/SearchJSON.js';
import BaseEvent from 'ol/events/Event';

/**
 * @typedef {Object} SearchGoogleOptions
 * @property {string} apiKey Google API key
 */
interface SearchGoogleOptions extends SearchOptions {
  // Add custom options here
  apiKey: string;
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
 *  @param {string|} options.apiKey Google API key (required)
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
    return {
      address: s,
      key: this.get('apiKey')
    };
  }

  /**
   * Handle server response to pass the features array to the list
   * @param {any} response server response
   * @return {Array<any>} an array of feature
   */
  handleResponse(response: any) {
    return response.results;
  }

  /** Prevent same feature to be drawn twice: test equality
   *  @param {any} f1 First feature to compare
   *  @param {any} f2 Second feature to compare
   *  @return {boolean}
   *  @api
   */
  equalFeatures(f1: any, f2: any) {
    return (f1.formatted_address === f2.formatted_address
      && f1.geometry.location.lat === f2.geometry.location.lat
      && f1.geometry.location.lng === f2.geometry.location.lng);
  }

  /** A line has been clicked in the menu > dispatch event
   *  @param {any} f the feature, as passed in the autocomplete
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
  reverseGeocode(coord: any, cback: (results: any) => void) {
    var lonlat = ol_proj_transform(coord, this.getMap().getView().getProjection(), 'EPSG:4326');
    this.ajax(
      this.get('url') + '?latlng=' + lonlat[1] + ',' + lonlat[0] + '&key=' + this.get('apiKey'),
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
