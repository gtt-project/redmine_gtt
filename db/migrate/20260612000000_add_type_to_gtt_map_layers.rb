class AddTypeToGttMapLayers < ActiveRecord::Migration[7.0]
  # The layer factory type selected on the client (xyz, wms, osm, ...).
  # NULL is treated as the default 'ol' factory, which constructs a layer
  # from OpenLayers class names, so existing rows keep working unchanged.
  # GttMapLayer sets inheritance_column = 'none', so this column is a plain
  # attribute and not used for single-table inheritance.
  def change
    add_column :gtt_map_layers, :type, :string
  end
end
