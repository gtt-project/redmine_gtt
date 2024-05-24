class RemoveGttMapLayerPositionDefault < ActiveRecord::Migration[5.2]
  def up
    change_column GttMapLayer.table_name, :position, :integer, :default => nil
  end

  def down
    change_column GttMapLayer.table_name, :position, :integer, :default => 0
  end
end
