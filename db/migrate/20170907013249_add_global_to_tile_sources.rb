class AddGlobalToTileSources < ActiveRecord::Migration[5.2]
  def change
    add_column :gtt_tile_sources, :global, :boolean
  end
end
