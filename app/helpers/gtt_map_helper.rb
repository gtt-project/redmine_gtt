# frozen_string_literal: true

module GttMapHelper

  def map_form_field(form, map, field: :geojson, edit_mode:)
    safe_join [
      form.hidden_field(field, id: 'geom'),
      map_tag(map: map, edit: edit_mode)
    ]
  end

  def map_tag(map: nil,
              geom: map.json, layers: map&.layers, bounds: geom, edit: nil)

    data = {
      geom: geom,
      layers: layers
    }
    data[:bounds] = bounds if bounds
    data[:edit]   = edit   if edit

    map_id = rand(36**8).to_s(36)
    content_tag(:div, "", data: data, id: "ol-#{map_id}", class: 'ol-map')
  end

end
