import { Map, Feature } from 'ol';
import { Geometry, Point } from 'ol/geom';
import { GeoJSON, WKT } from 'ol/format';
import { FeatureCollection } from 'geojson';
import VectorLayer from 'ol/layer/Vector';
import { FeatureLike } from 'ol/Feature';
import FontSymbol from 'ol-ext/style/FontSymbol';
import { transform, transformExtent } from 'ol/proj';

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

export const radiansToDegrees = (radians: number): number => {
  const degrees = radians * (180 / Math.PI);
  return (degrees + 360) % 360;
};

export const degreesToRadians = (degrees: number): number => degrees * (Math.PI / 180);

export const getMapSize = (map: Map): number[] => {
  const [width, height] = map.getSize();

  if (width <= 0 || height <= 0) {
    const target = map.getTarget() as HTMLElement;
    return [target.clientWidth, target.clientHeight];
  }

  return [width, height];
};

export const evaluateComparison = (left: any, operator: any, right: any): any => {
  if (typeof left == 'object') {
    left = JSON.stringify(left);
    return Function('"use strict";return (JSON.parse(\'' + left + '\')' + operator + right + ')')();
  } else {
    return Function('"use strict";return (' + left + operator + right + ')')();
  }
};

export const getObjectPathValue = (obj: any, path: string | Array<string>, def: any = null) => {
  const pathArr = Array.isArray(path)
    ? path
    : path.split('.').flatMap((key) => key.split(/\[([^}]+)\]/g).filter(Boolean));
  return pathArr.reduce((acc, key) => acc?.[key], obj) ?? def;
};

export function reloadFontSymbol() {
  if ('fonts' in document) {
    const symbolFonts: Array<String> = []
    for (const font in FontSymbol.defs.fonts) {
      symbolFonts.push(font)
    }
    if (symbolFonts.length > 0) {
      (document as any).fonts.addEventListener('loadingdone', (e: any) => {
        const fontIndex = e.fontfaces.findIndex((font: any) => {
          return symbolFonts.indexOf(font.family) >= 0
        })
        if (fontIndex >= 0) {
          this.maps.forEach((m: any) => {
            const layers = m.getLayers()
            layers.forEach((layer: any) => {
              if (layer instanceof VectorLayer &&
                  layer.getKeys().indexOf("title") >= 0 &&
                  layer.get("title") === "Features") {
                const features = layer.getSource().getFeatures()
                const pointIndex = features.findIndex((feature: Feature) => {
                  return feature.getGeometry().getType() === "Point"
                })
                if (pointIndex >= 0) {
                  // console.log("Reloading Features layer")
                  layer.changed()
                }
              }
            })
          })
        }
      })
    }
  }
}

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
 *  Updates map settings for Redmine filter
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
 * Parse page for WKT strings in history
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

