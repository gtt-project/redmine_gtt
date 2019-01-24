class AddProjectsGeometry < ActiveRecord::Migration[5.2]
  def self.up
    add_column :projects, :geom, :geometry, :srid => 4326
    add_index :projects, :geom, using: :gist
  end

  def self.down
    remove_column :projects, :geom
  end
end
