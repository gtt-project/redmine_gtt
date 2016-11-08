class AddUsersGeometry < ActiveRecord::Migration
  def self.up
    add_column :users, :geom, :geometry, :srid => 4326
    add_index :users, :geom, using: :gist
  end

  def self.down
    remove_column :users, :geom
    # remove_index :users, :geom
  end
end
