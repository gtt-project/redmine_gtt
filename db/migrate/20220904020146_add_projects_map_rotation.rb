class AddProjectsMapRotation < ActiveRecord::Migration[5.2]
  def self.up
    add_column :projects, :map_rotation, :integer, default: 0
  end

  def self.down
    remove_column :projects, :map_rotation
  end
end
