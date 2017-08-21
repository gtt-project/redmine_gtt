class CreateGttTileSources < ActiveRecord::Migration
  def change
    create_table :gtt_tile_sources do |t|
      t.string :name, null: false
      t.string :type, null: false
      t.jsonb :options

      t.timestamps null: false
    end
  end
end
