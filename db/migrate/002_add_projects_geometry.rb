class AddProjectsGeometry < ActiveRecord::Migration
  def self.up
    add_column :projects, :geom, :geometry, :srid => 4326
    add_index :projects, :geom, using: :gist
  end

  def self.down
    remove_column :projects, :geom
    # remove_index :projects, :geom
  end
end
