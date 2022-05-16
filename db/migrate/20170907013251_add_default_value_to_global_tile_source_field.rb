class AddDefaultValueToGlobalTileSourceField < ActiveRecord::Migration[5.2]
  def up
    change_column :gtt_tile_sources, :global, :boolean, default: false
  end

  def down
    change_column :gtt_tile_sources, :global, :boolean, default: nil
  end
end
