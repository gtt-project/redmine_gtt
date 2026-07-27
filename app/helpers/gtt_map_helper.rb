# frozen_string_literal: true

module GttMapHelper

  # Whether GTT content should render in the current view context (#278):
  # inside a project the gtt module must be enabled; global pages (no
  # project) always render it. Use project&.module_enabled?(:gtt) instead
  # when the content strictly requires a project.
  def gtt_module_active?(project)
    project.nil? || project.module_enabled?(:gtt)
  end

  def map_form_field(form, map, field: :geojson, bounds: nil, edit_mode: nil, upload: true, rotation: 0)
    safe_join [
      form.hidden_field(field, id: 'geom'),
      map_tag(map: map, bounds: bounds, edit: edit_mode, upload: upload, rotation: rotation)
    ]
  end

  # Renders the map container. The gtt-map Stimulus controller bootstraps the
  # OpenLayers client when the element connects, including after AJAX form
  # reloads; no inline script is involved.
  def map_tag(map: nil, layers: map&.layers,
              geom: map.json, bounds: map.bounds,
              edit: nil, popup: nil, upload: true,
              collapsed: false, rotation: map&.rotation)

    data = {
      controller: 'gtt-map',
      geom: geom.is_a?(String) ? geom : geom.to_json,
      rotation: rotation
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
    data[:geocoding] = true if Setting.plugin_redmine_gtt['enable_geocoding_on_map'] == 'true'
    data[:measure] = true if Setting.plugin_redmine_gtt['default_measure_enabled'] == 'true'
    data[:target] = true if Setting.plugin_redmine_gtt['default_target_enabled'] == 'true'

    content_tag(:div, "", data: data, class: 'ol-map',
      style: (collapsed ? "display: none" : "display: block"))
  end

end
