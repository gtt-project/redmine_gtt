import { Map, Feature } from 'ol';
import { Geometry, Point } from 'ol/geom';
import { GeoJSON, WKT } from 'ol/format';
import { FeatureCollection } from 'geojson';
import { FeatureLike } from 'ol/Feature';
import { transform, transformExtent } from 'ol/proj';

/**
 * Get the value of a cookie by its name.
 *
 * @param cname - The name of the cookie.
 * @returns The value of the cookie or an empty string if not found.
 */
export const getCookie = (cname: string): string => {
  const name = cname + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(name) === 0) {
      return c.substring(name.length, c.length);
    }
  }
  return '';
};

/**
 * Convert radians to degrees.
 *
 * @param radians - The value in radians to convert.
 * @returns The value in degrees.
 */
export const radiansToDegrees = (radians: number): number => {
  const degrees = radians * (180 / Math.PI);
  return (degrees + 360) % 360;
};

/**
 * Convert degrees to radians.
 *
 * @param degrees - The value in degrees to convert.
 * @returns The value in radians.
 */
export const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);

/**
 * Get the map size, taking into account the possibility of width or height being 0.
 *
 * @param map - The OpenLayers Map object.
 * @returns An array containing the width and height of the map.
 */
export const getMapSize = (map: Map): number[] => {
  const [width, height] = map.getSize();

  if (width <= 0 || height <= 0) {
    const target = map.getTarget() as HTMLElement;
    return [target.clientWidth, target.clientHeight];
  }

  return [width, height];
};

/**
 * Evaluate a comparison between two values with a specified operator.
 *
 * @param left - The left-hand side value of the comparison.
 * @param operator - The operator to use in the comparison.
 * @param right - The right-hand side value of the comparison.
 * @returns The result of the comparison.
 */
export const evaluateComparison = (left: any, operator: any, right: any): any => {
  if (typeof left == 'object') {
    left = JSON.stringify(left);
    return Function('"use strict";return (JSON.parse(\'' + left + '\')' + operator + right + ')')();
  } else {
    return Function('"use strict";return (' + left + operator + right + ')')();
  }
};

/**
 * Get the value of a nested property in an object using a path.
 *
 * @param obj - The object to get the value from.
 * @param path - The path to the property in the object, either as a string or an array of strings.
 * @param def - An optional default value to return if the property is not found.
 * @returns The value of the property or the default value if not found.
 */
export const getObjectPathValue = (obj: any, path: string | Array<string>, def: any = null) => {
  const pathArr = Array.isArray(path)
    ? path
    : path.split('.').flatMap((key) => key.split(/\[([^}]+)\]/g).filter(Boolean));
  return pathArr.reduce((acc, key) => acc?.[key], obj) ?? def;
};

/**
 * Update the form with the provided feature data.
 *
 * @param mapObj - The map object containing settings.
 * @param features - The features to update the form with.
 * @param updateAddressFlag - A flag to update the address field with reverse geocoding, default is false.
 */
export function updateForm(mapObj: any, features: FeatureLike[] | null, updateAddressFlag: boolean = false):void {
  if (features == null) {
    return
  }
  const geom = document.querySelector('#geom') as HTMLInputElement
  if (!geom) {
    return
  }

  const writer = new GeoJSON()
  // Convert to Feature<Geometry> type for GeoJSON writer
  const new_features: Feature<Geometry>[] = features.map((feature => {
    return new Feature<Geometry>({geometry: feature.getGeometry() as Geometry})
  }))
  const geojson_str = writer.writeFeatures(new_features, {
    featureProjection: 'EPSG:3857',
    dataProjection: 'EPSG:4326'
  })
  const geojson = JSON.parse(geojson_str) as FeatureCollection
  geom.value = JSON.stringify(geojson.features[0])

  const geocoder = JSON.parse(mapObj.defaults.geocoder)
  if (updateAddressFlag && geocoder.address_field_name && features && features.length > 0) {
    let addressInput: HTMLInputElement = null
    document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
      if (element.innerHTML.includes(geocoder.address_field_name)) {
        addressInput = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
      }
    })
    if (addressInput) {
      // Todo: only works with point geometries for now for the last geometry
      const geom = features[features.length - 1].getGeometry() as Point
      if (geom === null) {
        return
      }
      let coords = geom.getCoordinates()
      coords = transform(coords, 'EPSG:3857', 'EPSG:4326')
      const reverse_geocode_url = geocoder.reverse_geocode_url.replace("{lon}", coords[0].toString()).replace("{lat}", coords[1].toString())
      fetch(reverse_geocode_url)
        .then(response => response.json())
        .then(data => {
          const check = evaluateComparison(getObjectPathValue(data, geocoder.reverse_geocode_result_check_path),
            geocoder.reverse_geocode_result_check_operator,
            geocoder.reverse_geocode_result_check_value)
          let districtInput: HTMLInputElement = null
          document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
            if (element.innerHTML.includes(geocoder.district_field_name)) {
              districtInput = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
            }
          })
          const address = getObjectPathValue(data, geocoder.reverse_geocode_result_address_path)
          let foundDistrict = false
          if (check && address) {
            addressInput.value = address
            if (districtInput) {
              const district = getObjectPathValue(data, geocoder.reverse_geocode_result_district_path)
              if (district) {
                const regexp = new RegExp(geocoder.reverse_geocode_result_district_regexp)
                const match = regexp.exec(district)
                if (match && match.length === 2) {
                  districtInput.value = match[1]
                  foundDistrict = true
                }
              }
            }
          } else {
            addressInput.value = geocoder.empty_field_value
          }
          if (!foundDistrict) {
            if (districtInput) {
              districtInput.value = ''
            }
          }
        })
    }
  }

}

/**
 * Update the map settings for the Redmine filter.
 */
export function updateFilter() {
  let center = this.map.getView().getCenter()
  let extent = this.map.getView().calculateExtent(this.map.getSize())

  center = transform(center,'EPSG:3857','EPSG:4326')
  // console.log("Map Center (WGS84): ", center);
  const fieldset = document.querySelector('fieldset#location') as HTMLFieldSetElement
  if (fieldset) {
    fieldset.dataset.center = JSON.stringify(center)
  }
  const value_distance_3 = document.querySelector('#tr_distance #values_distance_3') as HTMLInputElement
  if (value_distance_3) {
    value_distance_3.value = center[0].toString()
  }
  const value_distance_4 = document.querySelector('#tr_distance #values_distance_4') as HTMLInputElement
  if (value_distance_4) {
    value_distance_4.value = center[1].toString()
  }

  // Set Permalink as Cookie
  const cookie = []
  const hash = this.map.getView().getZoom() + '/' +
    Math.round(center[0] * 1000000) / 1000000 + '/' +
    Math.round(center[1] * 1000000) / 1000000 + '/' +
    this.map.getView().getRotation()
  cookie.push("_redmine_gtt_permalink=" + hash)
  cookie.push("path=" + window.location.pathname)
  document.cookie = cookie.join(";")

  const extent_str = transformExtent(extent,'EPSG:3857','EPSG:4326').join('|')
  // console.log("Map Extent (WGS84): ",extent);
  const bbox = document.querySelector('select[name="v[bbox][]"]')
  if (bbox) {
    const option = bbox.querySelector('option') as HTMLOptionElement
    option.value = extent_str
  }
  // adjust the value of the 'On map' option tag
  // Also adjust the JSON data that's the basis for building the filter row
  // html (this is relevant if the map is moved first and then the filter is
  // added.)
  if(window.availableFilters && window.availableFilters.bbox) {
    window.availableFilters.bbox.values = [['On map', extent]]
  }
}

/**
 * Parse the history of the page for WKT strings and replace them with formatted links.
 */
export function parseHistory() {
  const historyItems = document.querySelectorAll('div#history ul.details i');

  const regex = /\b(?:POINT|LINESTRING|POLYGON)\b\s?\({1,}[-]?\d+([,. ]\s?[-]?\d+)*\){1,}/gi;
  const dataProjection = 'EPSG:4326';
  const featureProjection = 'EPSG:3857';

  const parseAndFormatWKT = (wkt: string) => {
    const feature = new WKT().readFeature(wkt, { dataProjection, featureProjection });
    let formattedWKT = new WKT().writeFeature(feature, { dataProjection, featureProjection, decimals: 5 });

    if (formattedWKT.length > 30) {
      const parts = formattedWKT.split(' ');
      formattedWKT = `${parts[0]}...${parts[parts.length - 1]}`;
    }

    return formattedWKT;
  };

  historyItems.forEach((item: Element) => {
    const match = item.innerHTML.match(regex);

    if (match !== null) {
      const wkt = parseAndFormatWKT(match.join(''));

      const link = document.createElement('a');
      link.href = '#';
      link.classList.add('wkt');
      link.dataset.feature = match.join('');
      link.textContent = wkt;

      // Replace current node with new link.
      item.replaceWith(link);
    }
  });
}

