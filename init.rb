# Global Hooks
require File.expand_path('../lib/redmine_gtt/hooks/view_layouts_base_html_head_hook', __FILE__)
require File.expand_path('../lib/redmine_gtt/view_hooks', __FILE__)

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  author_url 'https://github.com/georepublic'
  url 'https://github.com/gtt-project/redmine_gtt'
  description 'Adds location-based task management and maps'
  version '4.3.1'

  requires_redmine :version_or_higher => '4.2.0'

  project_module :gtt do
    permission :manage_gtt_settings, {
      projects: [ :update_gtt_configuration ]
    }, require: :member
    permission :view_gtt_settings, {
      gtt_configuration: %i( default_setting_configuration )
    }, require: :member, read: true
  end

  settings(
    :default => {
      'default_collapsed_issues_page_map' => false,
      'default_map_center_longitude' => 139.691706,
      'default_map_center_latitude' => 35.689524,
      'default_map_zoom_level' => 13,
      'default_map_maxzoom_level' => 19,
      'default_map_fit_maxzoom_level' => 17,
      'default_geocoder_options' => '{}',
      'editable_geometry_types_on_issue_map' => ["Point"],
      'enable_geojson_upload_on_issue_map' => false,
      'enable_geocoding_on_map' => false
    },
    partial: 'settings/gtt/settings'
  )

  menu :admin_menu,
    :gtt_map_layers,
    { controller: 'gtt_map_layers', action: 'index' },
    caption: :'map_layer.plural', html: { class: 'icon icon-gtt-map' }
end

# Register MIME Types
Mime::Type.register_alias "application/json", :geojson

# Automatically encode points to geojson with as_json in rails3
RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)

RGeo::ActiveRecord::SpatialFactoryStore.instance.tap do |config|
  # By default, use the GEOS implementation for spatial columns.
  # config.default = RGeo::Geos.factory_generator

  config.register RGeo::Cartesian.preferred_factory(srid: 4326), geo_type: 'geometry', sql_type: "geometry", srid: 4326

  # But use a geographic implementation for point columns.
  # config.register(RGeo::Geographic.spherical_factory(srid: 4326), geo_type: "point")
end

if Rails.version > '6.0' && Rails.autoloaders.zeitwerk_enabled?
  require File.expand_path('../app/overrides/issues', __FILE__)
  require File.expand_path('../app/overrides/projects', __FILE__)
  require File.expand_path('../app/overrides/users', __FILE__)
  RedmineGtt.setup_normal_patches
  Rails.application.config.after_initialize do
    RedmineGtt.setup_controller_patches
  end
else
  require 'redmine_gtt'
  # Configure View Overrides
  Rails.application.paths["app/overrides"] ||= []
  Rails.application.paths["app/overrides"] << File.expand_path("../app/overrides", __FILE__)

  ActiveSupport::Reloader.to_prepare do
    RedmineGtt.setup_normal_patches

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

  Rails.configuration.to_prepare do
    RedmineGtt.setup_controller_patches
  end
end

#class GttListener < Redmine::Hook::ViewListener
Class.new(Redmine::Hook::ViewListener) do |c|
  render_on :view_layouts_base_html_head, inline: <<-END
      <%= stylesheet_link_tag 'gtt', :plugin => 'redmine_gtt' %>
    END
end
