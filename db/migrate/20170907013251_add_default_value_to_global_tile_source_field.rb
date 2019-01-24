class AddDefaultValueToGlobalTileSourceField < ActiveRecord::Migration[5.2]
  def change
    change_column :gtt_tile_sources, :global, :boolean, default: false
  end
end
