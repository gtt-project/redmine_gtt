source 'https://rubygems.org'

# Define gem versions with environment variables or default versions
gem_versions = {
  pg: ENV['GEM_PG_VERSION'] || '1.5.3',
  rgeo: ENV['GEM_RGEO_VERSION'] || '3.0.1',
  rgeo_activerecord: ENV['GEM_RGEO_ACTIVERECORD_VERSION'] || '8.0.0',
  activerecord_postgis_adapter: ENV['GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION'] || '10.0.0'
}

gem 'deface'
gem 'immutable-struct'
gem "rgeo", "~> #{gem_versions[:rgeo]}"
gem "rgeo-geojson"
gem "pg", "~> #{gem_versions[:pg]}"
gem "rgeo-activerecord", "~> #{gem_versions[:rgeo_activerecord]}"
gem 'activerecord-postgis-adapter', "~> #{gem_versions[:activerecord_postgis_adapter]}"
gem 'rails-controller-testing' # This gem brings back assigns to your controller tests as well as assert_template to both controller and integration tests.
gem 'blankslate', '~> 3.1.3'
