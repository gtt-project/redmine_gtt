# Redmine Geo-Task-Tracker (GTT) Plugin

[![CI](https://github.com/gtt-project/redmine_gtt/workflows/Test%20with%20PostGIS/badge.svg)](https://github.com/gtt-project/redmine_gtt/actions?query=workflow%3A%22Test%20with%20PostGIS%22+branch%3Amain)

The Geo-Task-Tracker (GTT) plugin adds spatial capabilities to Redmine:

- Locate your issues as point, line or polygon
- Show and filter issues on a map
- Specify a project area
- Store the location of a user
- Extends Redmine API
- Geocoding
- and more

## Requirements

Redmine GTT plugins **require PostgreSQL/PostGIS** and will not work with SQLite
or MariaDB/MySQL!!!

- Redmine >= 5.0.0
- PostgreSQL >= 12
- PostGIS >= 3.0
- NodeJS v18
- yarn

## Installation

Create a PostGIS-enabled database:

```sh
createdb -U postgres -O redmine redmine
psql -U postgres -d redmine -c "CREATE EXTENSION postgis;"
```

To install Redmine GTT plugin, download or clone this repository in your Redmine
installation plugins directory!

```sh
cd path/to/plugin/directory
git clone https://github.com/gtt-project/redmine_gtt.git
cd redmine_gtt
yarn
npx webpack
```

Optionally export to override the [default GEM version](./Gemfile)

```sh
export GEM_PG_VERSION=your-pg-version
export GEM_RGEO_ACTIVERECORD_VERSION=your-rgeo-activerecord-version
export GEM_ACTIVERECORD_POSTGIS_ADAPTER_VERSION=your-activerecord-postgis-adapter-version
```

Then run

```sh
bundle install
bundle exec rake redmine:plugins:migrate
```

Before restarting Redmine, you need to set `postgis` adapter instead of
`postgres` adapter in your `config/database.yml`.

After restarting Redmine, you should be able to see the Redmine GTT plugin in
the Plugins page.

More information on installing (and uninstalling) Redmine plugins can be found
in the [Redmine Plugin docs](http://www.redmine.org/wiki/redmine/Plugins).

## How to use

1. Go to plugin configuration for global settings
2. Configure at least one tile source
3. Enable `GTT` module in a project
4. Define the project boundary in `GTT` project settings
5. Create a new issue with a point, line or polygon

For more information with screenshots see the [Getting Started](doc/getting-started.md)
guide.

## Plugin API

For more information see the [Redmine GTT API](doc/api.md) docs.

## Contributing and Support

The GTT Project appreciates any [contributions](https://github.com/gtt-project/.github/blob/main/CONTRIBUTING.md)!
Feel free to contact us for [reporting problems and support](https://github.com/gtt-project/.github/blob/main/CONTRIBUTING.md).

Help us to translate GTT Project using [OSGeo Weblate](https://weblate.osgeo.org/engage/gtt-project/):

[![Translation status](https://weblate.osgeo.org/widgets/gtt-project/-/redmine_gtt/multi-auto.svg)](https://weblate.osgeo.org/engage/gtt-project/)

### How to debug frontend

You can debug frontend by running the following command on another console:

```sh
npx webpack --watch --mode=development --devtool=source-map
```

### How to run test

You can run the plugin test on rails test environment by the following command:

```sh
bundle exec rake db:create
RAILS_ENV=test bundle exec rake db:migrate
RAILS_ENV=test bundle exec rake redmine:plugins:migrate
RAILS_ENV=test NAME=redmine_gtt bundle exec rake redmine:plugins:test
```

## Version History

See [all releases](https://github.com/gtt-project/redmine_gtt/releases) with
release notes.

## Authors

- [Jens Kraemer](https://github.com/jkraemer)
- [Daniel Kastl](https://github.com/dkastl)
- [Thibault Mutabazi](https://github.com/eyewritecode)
- [Ko Nagase](https://github.com/sanak)
- [Taro Matsuzawa](https://github.com/smellman)
- [Mario Basa](https://github.com/mbasa)
- [Nisai Nob](https://github.com/nobnisai)
- ... [and others](https://github.com/gtt-project/redmine_gtt/graphs/contributors)

## LICENSE

This program is free software. See [LICENSE](LICENSE) for more information.
