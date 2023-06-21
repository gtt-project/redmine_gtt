import { Map, Feature } from 'ol';
import { Point } from 'ol/geom';
import { transform, fromLonLat } from 'ol/proj';
import { getCenter } from 'ol/extent';
import Bar from 'ol-ext/control/Bar';
import Toggle from 'ol-ext/control/Toggle';
import TextButton from 'ol-ext/control/TextButton';

import { evaluateComparison, getObjectPathValue } from '../helpers';

/**
 * Add Geocoding functionality
 */
export function setGeocoding(currentMap: Map):void {

  // Hack to add Geocoding buttons to text fields
  // There should be a better way to do this
  const geocoder = JSON.parse(this.defaults.geocoder)
  if (geocoder.geocode_url &&
      geocoder.address_field_name &&
      document.querySelectorAll("#issue-form #attributes button.btn-geocode").length == 0)
  {
    document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
      if (element.textContent.includes(geocoder.address_field_name)) {
        element.querySelectorAll('p').forEach(p_element => {
          const button = document.createElement('button') as HTMLButtonElement
          button.name = 'button'
          button.type = 'button'
          button.className = 'btn-geocode'
          button.appendChild(document.createTextNode(geocoder.address_field_name))
          p_element.appendChild(button)
        })
      }
    })

    document.querySelectorAll('button.btn-geocode').forEach(element => {
      element.addEventListener('click', (evt) => {
        // Geocode address and add/update icon on map
        const button = evt.currentTarget as HTMLButtonElement
        if (button.previousElementSibling.querySelector('input').value != '') {
          const address = button.previousElementSibling.querySelector('input').value
          const geocode_url = geocoder.geocode_url.replace("{address}", encodeURIComponent(address))
          fetch(geocode_url)
            .then(response => response.json())
            .then(data => {
              const check = evaluateComparison(getObjectPathValue(data, geocoder.geocode_result_check_path),
                geocoder.geocode_result_check_operator,
                geocoder.geocode_result_check_value
              )
              if (check) {
                const lon = getObjectPathValue(data, geocoder.geocode_result_lon_path)
                const lat = getObjectPathValue(data, geocoder.geocode_result_lat_path)
                const coords = [lon, lat]
                const geom = new Point(fromLonLat(coords, 'EPSG:3857'))
                const features = this.vector.getSource().getFeatures()
                if (features.length > 0) {
                  features[features.length - 1].setGeometry(geom)
                } else {
                  const feature = new Feature(geom)
                  this.vector.getSource().addFeatures([feature])
                }
                this.updateForm(this.vector.getSource().getFeatures())
                this.zoomToExtent(true)

                const _districtInput = document.querySelectorAll(`#issue-form #attributes label`)
                let districtInput: HTMLInputElement = null
                _districtInput.forEach(element => {
                  if (element.innerHTML.includes(geocoder.district_field_name)) {
                    districtInput = element.parentNode.querySelector('p').querySelector('input')
                  }
                })
                let foundDistrict = false
                if (districtInput) {
                  const district = getObjectPathValue(data, geocoder.geocode_result_district_path)
                  if (district) {
                    const regexp = new RegExp(geocoder.geocode_result_district_regexp)
                    const match = regexp.exec(district)
                    if (match && match.length === 2) {
                      districtInput.value = match[1]
                      foundDistrict = true
                    }
                  }
                  if (!foundDistrict) {
                    if (districtInput) {
                      districtInput.value = ""
                    }
                  }
                }
              }
            })
        }
      })
    })
  }

  if (geocoder.place_search_url &&
      geocoder.place_search_field_name &&
      document.querySelectorAll("#issue-form #attributes button.btn-placesearch").length == 0 )
  {
    document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
      if (element.innerHTML.includes(geocoder.place_search_field_name)) {
        element.querySelectorAll('p').forEach(p_element => {
          const button = document.createElement('button') as HTMLButtonElement
          button.name = 'button'
          button.type = 'button'
          button.className = 'btn-placesearch'
          button.appendChild(document.createTextNode(geocoder.place_search_field_name))
          p_element.appendChild(button)
        })
      }
    })

    document.querySelectorAll("button.btn-placesearch").forEach(element => {
      element.addEventListener('click', () => {
        if (this.vector.getSource().getFeatures().length > 0) {
          let coords = null
          this.vector.getSource().getFeatures().forEach((feature: any) => {
            // Todo: only works with point geometries for now for the last geometry
            coords = getCenter(feature.getGeometry().getExtent())
          })
          coords = transform(coords, 'EPSG:3857', 'EPSG:4326')
          const place_search_url = geocoder.place_search_url.replace("{lon}", coords[0].toString()).replace("{lat}", coords[1].toString())
          fetch(place_search_url)
            .then(response => response.json())
            .then(data => {
              const list:Array<any> = getObjectPathValue(data, geocoder.place_search_result_list_path)
              if (list.length > 0) {
                const modal = document.querySelector('#ajax-modal') as HTMLDivElement
                modal.innerHTML = `
                <h3 class='title'>${geocoder.place_search_result_ui_title}</h3>
                <div id='places'></div>
                <p class='buttons'>
                <input type='submit' value='${geocoder.place_search_result_ui_button}' onclick='hideModal(this)'/>
                </p>
                `
                modal.classList.add('place_search_results')
                list.forEach(item => {
                  const display = getObjectPathValue(item, geocoder.place_search_result_display_path)
                  const value = getObjectPathValue(item, geocoder.place_search_result_value_path)
                  if (display && value) {
                    const places = document.querySelector('div#places') as HTMLDivElement
                    const input = document.createElement('input') as HTMLInputElement
                    input.type = 'radio'
                    input.name = 'places'
                    input.value = value
                    input.appendChild(document.createTextNode(display))
                    places.appendChild(input)
                    places.appendChild(document.createElement('br'))
                  }
                })
                window.showModal('ajax-model', '400px')
                document.querySelector("p.buttons input[type='submit']").addEventListener('click', () => {
                  let input: HTMLInputElement = null
                  document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
                    if (element.innerHTML.includes(geocoder.place_search_field_name)) {
                      input = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
                    }
                  })
                  if (input) {
                    input.value = (document.querySelector("div#places input[type='radio']:checked") as HTMLInputElement).value
                  }
                })
              } else {
                let input: HTMLInputElement = null
                document.querySelectorAll(`#issue-form #attributes label`).forEach(element => {
                  if (element.innerHTML.includes(geocoder.place_search_field_name)) {
                    input = element.parentNode.querySelector('p').querySelector('input') as HTMLInputElement
                  }
                })
                if (input) {
                  input.value = geocoder.empty_field_value
                }
              }
            })
        }
      })
    })
  }

  // disable geocoding control if plugin setting is not true
  if (this.contents.geocoding !== "true") {
    return
  }

  const mapId = currentMap.getTargetElement().getAttribute("id")

  // Control button
  const geocodingCtrl = new Toggle({
    html: '<i class="mdi mdi-map-search-outline"></i>',
    title: this.i18n.control.geocoding,
    className: "ctl-geocoding",
    onToggle: (active: boolean) => {
      const text = (document.querySelector("div#" + mapId + " .ctl-geocoding div input") as HTMLInputElement)
      if (active) {
        text.focus()
      } else {
        text.blur()
        const button = document.querySelector<HTMLButtonElement>("div#" + mapId + " .ctl-geocoding button")
        button.blur()
      }
    },
    bar: new Bar({
      controls: [
        new TextButton({
          html: '<form><input name="address" type="text" /></form>'
        })
      ]
    })
  })
  this.toolbar.addControl(geocodingCtrl)

  // Make Geocoding API request
  document.querySelector<HTMLInputElement>("div#" + mapId + " .ctl-geocoding div input").addEventListener('keydown', (evt) => {
    if (evt.keyCode === 13) {
      evt.preventDefault()
      evt.stopPropagation()
    } else {
      return true
    }

    if (!geocoder.geocode_url) {
      throw new Error ("No Geocoding service configured!")
    }

    const url = geocoder.geocode_url.replace("{address}", encodeURIComponent(
      (document.querySelector("div#" + mapId + " .ctl-geocoding form input[name=address]") as HTMLInputElement).value)
    )

    fetch(url)
      .then(response => response.json())
      .then(data => {
        const check = evaluateComparison(getObjectPathValue(data, geocoder.geocode_result_check_path),
          geocoder.geocode_result_check_operator,
          geocoder.geocode_result_check_value
        )
        if (check) {
          const lon = getObjectPathValue(data, geocoder.geocode_result_lon_path)
          const lat = getObjectPathValue(data, geocoder.geocode_result_lat_path)
          const coords = [lon, lat]
          const geom = new Point(fromLonLat(coords, 'EPSG:3857'))
          currentMap.getView().fit(geom.getExtent(), {
            size: currentMap.getSize(),
            maxZoom: parseInt(this.defaults.fitMaxzoom)
          })
        }
      })

    return false
  })
}
