class AddDefaultValueToGlobalTileSourceField < ActiveRecord::Migration
  def change
    change_column :gtt_tile_sources, :global, :boolean, default: false
  end
end
