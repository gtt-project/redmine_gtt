# frozen_string_literal: true

module GttMapHelper

  def map_form_field(form, map, field: :geojson, bounds: nil, edit_mode: nil, upload: true, rotation: 0)
    safe_join [
      form.hidden_field(field, id: 'geom'),
      map_tag(map: map, bounds: bounds, edit: edit_mode, upload: upload, rotation: rotation)
    ]
  end

  def map_tag(map: nil, layers: map&.layers,
              geom: map.json, bounds: map.bounds,
              edit: nil, popup: nil, upload: true,
              collapsed: false, rotation: map&.rotation)

    data = {
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

    uid = "ol-" + rand(36**8).to_s(36)

    safe_join [
      content_tag(:div, "", data: data, id: uid, class: 'ol-map',
        style: (collapsed ? "display: none" : "display: block")),
      javascript_tag("
        var contentObserver = () => {
          const target = document.getElementById('#{uid}');
          const observerCallback = function(mutations) {
            mutations.forEach(function(mutation) {
              if (mutation.removedNodes.length) {
                mutation.removedNodes.forEach(function(node) {
                  if (node === target) {
                    observer.disconnect();
                    let event = new Event('contentUpdated');
                    document.dispatchEvent(event);
                  }
                });
              }
            });
          };
          const observer = new MutationObserver(observerCallback);
          const config = {
            childList: true,
            subtree: true
          };
          observer.observe(document.body, config);
        }
        document.addEventListener('contentUpdated', function(){
          var target = document.getElementById('#{uid}');
          window.createGttClient(target);
          contentObserver();
        }, { once: true });
        document.addEventListener('DOMContentLoaded', function(){
          var target = document.getElementById('#{uid}');
          window.createGttClient(target);
          contentObserver();
        });
      ")
    ]
  end

end
