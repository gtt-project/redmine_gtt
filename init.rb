Rails.logger.info 'Starting GeoTask plugin for RedMine'

require 'redmine'

Redmine::Plugin.register :redmine_gtt do
  name 'Redmine GTT plugin'
  author 'Georepublic'
  description 'This is a plugin for location-based task management in Redmine'
  version '0.0.1'
  # url 'http://example.com/path/to/plugin'
  author_url 'https://georepublic.info'

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

# Home Page Redirector
require_dependency 'home_page_redirector'

Rails.configuration.to_prepare do
  # This tells the Redmine version's controller to include the module from the file above.
  WelcomeController.send(:include, HomePageRedirector::HomePageRedirector)
end
