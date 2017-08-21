class GttOsmTileSource < GttTileSource

  store_accessor :options, :url, :min_zoom, :max_zoom

  # name of the corresponding class in ol.source namespace
  def self.ol_class
    'OSM'
  end


end
