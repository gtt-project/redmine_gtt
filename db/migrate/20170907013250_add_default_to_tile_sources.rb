class AddDefaultToTileSources < ActiveRecord::Migration[5.2]
  def change
    add_column :gtt_tile_sources, :default, :boolean, default: false
  end
end
