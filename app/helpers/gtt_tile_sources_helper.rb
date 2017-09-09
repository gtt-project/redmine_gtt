module GttTileSourcesHelper
  def pretty_tile_source_options(tile_source)
    JSON.pretty_generate tile_source.options if Hash === tile_source.options
  end

  def tile_source_options(tile_source)
    safe_join tile_source.options.to_a.select{
      |k,v| v.present?
    }.map{|k,v|
      "#{k}: #{v}"
    }, "<br />".html_safe
  end
end
