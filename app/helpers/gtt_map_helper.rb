# frozen_string_literal: true

module GttMapHelper

  def map_form_field(form, map, field: :geojson, bounds: nil, edit_mode: nil, upload: true)
    safe_join [
      form.hidden_field(field, id: 'geom'),
      map_tag(map: map, bounds: bounds, edit: edit_mode, upload: upload)
    ]
  end

  def map_tag(map: nil, layers: map&.layers,
              geom: map.json, bounds: map.bounds,
              edit: nil, popup: nil, upload: true,
              collapsed: false)

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
    data[:upload] = upload
    data[:collapsed] = collapsed if collapsed

    uid = "ol-" + rand(36**8).to_s(36)

    safe_join [
      content_tag(:div, "", data: data, id: uid, class: 'ol-map',
        style: (collapsed ? "display: none" : "display: block")),
      javascript_tag("
        document.addEventListener('DOMContentLoaded', function(){
          var target = document.getElementById('#{uid}');
          window.createGttClient(target);
        });
      ")
    ]
  end

end
