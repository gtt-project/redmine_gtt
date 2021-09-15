require 'redmine'

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  author_url 'https://github.com/georepublic'
  url 'https://github.com/gtt-project/redmine_gtt'
  description 'Adds location-based task management and maps'
  version '2.1.0'

  requires_redmine :version_or_higher => '4.0.0'

  project_module :gtt do
    permission :manage_gtt_settings, {
      projects: [ :update_gtt_configuration ]
    }, require: :member
  end

  settings(
    :default => {
      'default_map_center_longitude' => 139.691706,
      'default_map_center_latitude' => 35.689524,
      'default_map_zoom_level' => 13,
      'default_map_maxzoom_level' => 19,
      'default_map_fit_maxzoom_level' => 17,
      'default_geocoder_options' => '{}',
      'editable_geometry_types_on_issue_map' => ["Point"],
      'enable_geojson_upload_on_issue_map' => false
    },
    partial: 'settings/gtt/settings'
  )

  menu :admin_menu,
    :gtt_tile_sources,
    { controller: 'gtt_tile_sources', action: 'index' },
    caption: :label_gtt_tile_source_plural, :html => {:class => 'icon'}
end

ActiveSupport::Reloader.to_prepare do

  # Automatically encode points to geojson with as_json in rails3
  RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)

  RedmineGtt.setup

  # ActiveRecord::Base.include_root_in_json = true
  # module RGeo
  #   module Feature
  #     module Point
  #       def as_json(params)
  #         ::RGeo::GeoJSON.encode(self)
  #       end
  #     end
  #   end
  # end
end

class GttListener < Redmine::Hook::ViewListener
  render_on :view_layouts_base_html_head, inline: <<-END
      <%= stylesheet_link_tag 'gtt', :plugin => 'redmine_gtt' %>
    END
end
