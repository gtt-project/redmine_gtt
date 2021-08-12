class AddDefaultToTileSources < ActiveRecord::Migration[5.2]
  def change
    add_column :baselayer, :default, :boolean, default: true
  end
end
