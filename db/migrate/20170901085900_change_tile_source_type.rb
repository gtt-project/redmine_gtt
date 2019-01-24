class ChangeTileSourceType < ActiveRecord::Migration[5.2]
  def change
    execute "update gtt_tile_sources set type = 'ol.source.OSM'"
  end
end
