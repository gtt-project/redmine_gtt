Rails.logger.info 'Starting GeoTask plugin for RedMine'

require 'pp'
require 'redmine'

GTT_VERSION_NUMBER = '0.1.0'

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  description 'This is a plugin for location-based task management in Redmine'
  version GTT_VERSION_NUMBER
  url 'https://georepublic.info'
  author_url 'mailto:info@georepublic.de'

  requires_redmine :version_or_higher => '3.4.0'

  project_module :gtt do
    permission :manage_gtt_settings, {
      projects: [ :update_gtt_configuration ]
    }, require: :loggedin
  end

  # begin
  #   requires_redmine_plugin :redmine_language_change, :version_or_higher => '0.0.1'
  # rescue Redmine::PluginNotFound  => e
  #   raise "Please install redmine_language_change plugin"
  # end

  settings(
    :default => {
      'map_center_longitude' => 139.691706,
      'map_center_latitude' => 35.689524,
      'map_zoom_level' => 8,
      'map_maxzoom_level' => 18
    },
  )

  menu :admin_menu,
    :gtt_tile_sources,
    { controller: 'gtt_tile_sources', action: 'index' },
    caption: :label_gtt_tile_source_plural
end

ActionDispatch::Callbacks.to_prepare do

  # Automatically encode points to geojson with as_json in rails3
  RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)

  # require_dependency 'home_page_redirector'
  require 'redmine_gtt'

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


