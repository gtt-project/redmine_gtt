class ChangeTileSourceType < ActiveRecord::Migration
  def change
    execute "update gtt_tile_sources set type = 'ol.source.OSM'"
  end
end
