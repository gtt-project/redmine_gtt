class AddDefaultToTileSources < ActiveRecord::Migration
  def change
    add_column :gtt_tile_sources, :default, :boolean, default: false
  end
end
