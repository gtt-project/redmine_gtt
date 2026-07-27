source 'https://rubygems.org'

# The GEM_* environment variables force an exact geo gem stack (useful for
# deployments and debugging). Without them, the default ranges are left open
# enough for Bundler to pick the stack matching the host Redmine's Rails
# version through the gems' own activerecord constraints:
#   Redmine 6.x (Rails 7.2) -> activerecord-postgis-adapter 10.x + rgeo-activerecord 8.0.x
#   Redmine 7.0 (Rails 8.1) -> activerecord-postgis-adapter 11.1.x + rgeo-activerecord 8.1.x
geo_gem_requirement = lambda do |env_var, *default_requirement|
  pin = ENV[env_var].to_s.strip
  pin.empty? ? default_requirement : ["~> #{pin}"]
end

gem 'deface'
gem 'immutable-struct'
gem 'rgeo', *geo_gem_requirement.call('GEM_RGEO_VERSION', '~> 3.0')
gem 'rgeo-geojson'
gem 'pg', *geo_gem_requirement.call('GEM_PG_VERSION', '~> 1.5')
gem 'rgeo-activerecord', *geo_gem_requirement.call('GEM_RGEO_ACTIVERECORD_VERSION', '>= 8.0', '< 9')
gem 'activerecord-postgis-adapter', *geo_gem_requirement.call('GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION', '>= 10.0', '< 12')
gem 'rails-controller-testing' # This gem brings back assigns to your controller tests as well as assert_template to both controller and integration tests.
