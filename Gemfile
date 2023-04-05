source 'https://rubygems.org'

gem 'deface'
gem 'immutable-struct'
gem "rgeo", "~> 2.4.0"
gem "rgeo-geojson"
gem "pg", compatible_pg_version
gem "rgeo-activerecord", compatible_rgeo_activerecord_version
gem 'activerecord-postgis-adapter', compatible_activerecord_postgis_adapter_version
gem 'rails-controller-testing'

group :development, :test do
  gem 'pry'
end

def compatible_pg_version
  if ENV['GEM_PG_VERSION']
    "~> #{ENV['GEM_PG_VERSION']}"
  else
    "~> 1.2.2"
  end
end

def compatible_rgeo_activerecord_version
  if ENV['GEM_RGEO_ACTIVERECORD_VERSION']
    "~> #{ENV['GEM_RGEO_ACTIVERECORD_VERSION']}"
  else
    "~> 7.0.1"
  end
end

def compatible_activerecord_postgis_adapter_version
  if ENV['GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION']
    "~> #{ENV['GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION']}"
  else
    "~> 7.1.1"
  end
end
