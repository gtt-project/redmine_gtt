# Pinned to Rails 7.2, the floor of the plugin's supported range
# (Redmine 6.0). The [5.2] pins in older migrations date from the
# Redmine 4/5 era; new migrations pin the current floor instead.
class AddTypeToGttMapLayers < ActiveRecord::Migration[7.2]
  # The layer factory type selected on the client (xyz, wms, osm, ...).
  # NULL is treated as the default 'ol' factory, which constructs a layer
  # from OpenLayers class names, so existing rows keep working unchanged.
  # GttMapLayer sets inheritance_column = 'none', so this column is a plain
  # attribute and not used for single-table inheritance.
  def change
    add_column :gtt_map_layers, :type, :string
  end
end
