class CreateGttMapLayers < ActiveRecord::Migration[6.1]
  def change
    create_table :gtt_map_layers do |t|
      t.string :name, null: false

      t.string :layer, null: false
      t.jsonb  :layer_options
      t.string :source
      t.jsonb  :source_options
      t.string :format
      t.jsonb  :format_options
      t.text   :styles

      t.boolean :global, default: false
      t.boolean :default, default: false
      t.boolean :baselayer, default: true

      t.integer :position, default: 0
      t.timestamps null: false
    end
  end
end
