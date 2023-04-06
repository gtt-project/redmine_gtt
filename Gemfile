source 'https://rubygems.org'

# Define gem versions with environment variables or default versions
gem_versions = {
  pg: ENV['GEM_PG_VERSION'] || '1.2.2',
  rgeo: ENV['GEM_RGEO_VERSION'] || '2.4.0',
  rgeo_activerecord: ENV['GEM_RGEO_ACTIVERECORD_VERSION'] || '7.0.1',
  activerecord_postgis_adapter: ENV['GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION'] || '7.1.1'
}

gem 'deface'
gem 'immutable-struct'
gem "rgeo", "~> #{gem_versions[:rgeo]}"
gem "rgeo-geojson"
gem "pg", "~> #{gem_versions[:pg]}"
gem "rgeo-activerecord", "~> #{gem_versions[:rgeo_activerecord]}"
gem 'activerecord-postgis-adapter', "~> #{gem_versions[:activerecord_postgis_adapter]}"
gem 'rails-controller-testing' # This gem brings back assigns to your controller tests as well as assert_template to both controller and integration tests.
