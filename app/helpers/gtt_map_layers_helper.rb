module GttMapLayersHelper
  def pretty_map_layer_layer_options(map_layer)
    JSON.pretty_generate map_layer.layer_options if Hash === map_layer.layer_options
  end

  def map_layer_layer_options(map_layer)
    safe_join map_layer.layer_options.to_a.select{
      |k,v| v.present?
    }.map{|k,v|
      "#{k}: #{v}"
    }, "<br />".html_safe
  end
end
