class AddUsersGeometry < ActiveRecord::Migration[5.2]
  def self.up
    add_column :users, :geom, :geometry, :srid => 4326
    add_index :users, :geom, using: :gist
  end

  def self.down
    remove_column :users, :geom
  end
end
