class CreateGttMapLayersProjectsTable < ActiveRecord::Migration[6.1]
  def change
    create_join_table :gtt_map_layers, :projects do |t|
      t.index :project_id
      t.index :gtt_map_layer_id
    end
  end
end
