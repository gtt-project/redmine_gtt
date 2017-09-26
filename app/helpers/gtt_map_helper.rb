# frozen_string_literal: true

module GttMapHelper

  def map_form_field(form, map, field: :geojson, edit_mode:)
    safe_join [
      form.hidden_field(field, id: 'geom'),
      map_tag(map: map, bounds: map.bounds, edit: edit_mode)
    ]
  end

  def map_tag(map: nil, layers: map&.layers,
              geom: map.json, bounds: map.bounds,
              edit: nil, popup: nil)

    data = {
      geom: geom.is_a?(String) ? geom : geom.to_json
    }

    if layers
      data[:layers] = layers.is_a?(String) ? layers : layers.to_json
    end

    if bounds
      data[:bounds] = bounds.is_a?(String) ? bounds : bounds.to_json
    end

    data[:edit]   = edit   if edit
    data[:popup]  = popup  if popup

    content_tag(:div, "", data: data, id: "ol-#{rand(36**8).to_s(36)}", class: 'ol-map')
  end

end
