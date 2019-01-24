class CreateGttTileSourcesProjectsTable < ActiveRecord::Migration[5.2]
  def change
    create_join_table :gtt_tile_sources, :projects do |t|
      t.index :project_id
      t.index :gtt_tile_source_id
    end
  end
end
