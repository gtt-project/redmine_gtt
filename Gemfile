source 'https://rubygems.org'

gem 'deface'
gem 'immutable-struct'
gem "rgeo"
gem "rgeo-geojson"
gem "rgeo-activerecord"

# TODO: the following path variable requires to run bundler from application
# Eventually there is a way to do this directory independent, so bundler can
# be also run from the plugin directory.
# Otherwise variable `database_file` is already determined on the Gemfile of
# Redmine.`
database_file = File.join(File.dirname(__FILE__), "../../config/database.yml")

if File.exist?(database_file)
  database_config = YAML::load(ERB.new(IO.read(database_file)).result)
  adapters = database_config.values.map {|c| c['adapter']}.compact.uniq
  if adapters.any?
    adapters.each do |adapter|
      case adapter
      when /postgresql/
        gem 'activerecord-postgis-adapter'
      else
        warn("GTT doesn't support `#{adapter}` found in config/database.yml,
              use Gemfile.local to load your own database gems")
      end
    end
  else
    warn("No adapter found in config/database.yml, please configure it first")
  end
else
  warn("Please configure your config/database.yml first")
end
