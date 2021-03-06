class AddIssuesGeometry < ActiveRecord::Migration[5.2]
  def self.up
    add_column :issues, :geom, :geometry, :srid => 4326
    add_index :issues, :geom, using: :gist
  end

  def self.down
    remove_column :issues, :geom
  end
end
