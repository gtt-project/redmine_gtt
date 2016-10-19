Rails.logger.info 'Starting GeoTask plugin for RedMine'

require 'redmine'

GTT_VERSION_NUMBER = '0.1.0'

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  description 'This is a plugin for location-based task management in Redmine'
  version GTT_VERSION_NUMBER
  url 'https://georepublic.info'
  author_url 'mailto:info@georepublic.de'

	requires_redmine :version_or_higher => '3.3.0'

	settings(
		:default => {
			'map_projection'=>'EPSG:4326',
			'default_map_center_longitude' => 139.691706,
			'default_map_center_latitude' => 35.689524,
			'default_map_zoom_level' => 8
		},
		:partial => 'settings/gtt_settings'
	)
end

# Dependencies
require_dependency 'home_page_redirector'
require 'redmine_gtt'
