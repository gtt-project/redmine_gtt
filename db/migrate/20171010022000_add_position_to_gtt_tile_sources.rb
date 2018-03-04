class AddPositionToGttTileSources < ActiveRecord::Migration
  def change
    add_column :gtt_tile_sources, :position, :integer, default: 0
  end
end
