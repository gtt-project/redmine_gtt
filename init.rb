require_relative 'lib/redmine_gtt/view_hooks'

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  author_url 'https://github.com/georepublic'
  url 'https://github.com/gtt-project/redmine_gtt'
  description 'Adds location-based task management and maps'
  version '6.0.3'

  requires_redmine :version_or_higher => '5.1.0'

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
      'vector_minzoom_level' => 0,
      'default_target_enabled' => false,
      'default_measure_enabled' => false,
      'default_geocoder_options' => '{}',
      'editable_geometry_types_on_issue_map' => ["Point"],
      'enable_geojson_upload_on_issue_map' => false,
      'enable_geocoding_on_map' => false,
      'hide_map_for_invalid_geom' => false
    },
    partial: 'settings/gtt/settings'
  )

  menu :admin_menu,
    :gtt_map_layers,
    { controller: 'gtt_map_layers', action: 'index' },
    caption: :'map_layer.plural', html: { class: 'icon icon-gtt-map' },
    :icon => 'gtt-map', :plugin => :redmine_gtt
end

# Register MIME Types
Mime::Type.register_alias "application/json", :geojson

# Automatically encode points to geojson with as_json in rails3
RGeo::ActiveRecord::GeometryMixin.set_json_generator(:geojson)

RGeo::ActiveRecord::SpatialFactoryStore.instance.tap do |config|
  config.register RGeo::Cartesian.preferred_factory(has_z_coordinate: true, srid: 4326), geo_type: 'geometry', sql_type: "geometry", srid: 4326
end

Dir.glob("#{Rails.root}/plugins/redmine_gtt/app/overrides/**/*.rb").each do |path|
  Rails.autoloaders.main.ignore(path)
  require path
end

RedmineGtt.setup_normal_patches
Rails.application.config.after_initialize do
  RedmineGtt.setup_controller_patches
end
