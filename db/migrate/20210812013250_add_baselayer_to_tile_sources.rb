class AddBaselayerToTileSources < ActiveRecord::Migration[5.2]
  def change
    add_column :gtt_tile_sources, :baselayer, :boolean, default: true
  end
end
