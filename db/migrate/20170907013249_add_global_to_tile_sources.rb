class AddGlobalToTileSources < ActiveRecord::Migration
  def change
    add_column :gtt_tile_sources, :global, :boolean
  end
end
