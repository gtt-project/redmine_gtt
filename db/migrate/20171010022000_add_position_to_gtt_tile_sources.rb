class AddPositionToGttTileSources < ActiveRecord::Migration[5.2]
  def change
    add_column :gtt_tile_sources, :position, :integer, default: 0
  end
end
