# Redmine Geo-Task-Tracker (GTT) Plugin

![CI #develop](https://github.com/gtt-project/redmine_gtt/workflows/Test%20with%20Redmine/badge.svg)

The Geo-Task-Tracker (GTT) plugin adds spatial capabilities to Redmine:

- Locate your issues as point, line or polygon
- Show and filter issues on a map
- Specify a project area
- Store the location of a user
- Extends Redmine API
- Geocoding
- and more

## Requirements

Redmine GTT plugins **require PostgreSQL/PostGIS** and will not work with SQLite or MariaDB/MySQL!!!

- Redmine >= 4.0.0
- PostgreSQL >= 9.6
- PostGIS >= 2.4

## Installation

Create a PostGIS-enabled database:

```
createdb -U postgres -O redmine redmine
psql -U postgres -d redmine -c "CREATE EXTENSION postgis;"
```

To install Redmine GTT plugin, download or clone this repository in your Redmine installation plugins directory!

```
cd path/to/plugin/directory
git clone https://github.com/gtt-project/redmine_gtt.git
```

Then run

```
bundle install
bundle exec rake redmine:plugins:migrate
```

After restarting Redmine, you should be able to see the Redmine GTT plugin in the Plugins page.

More information on installing (and uninstalling) Redmine plugins can be found here: http://www.redmine.org/wiki/redmine/Plugins

## How to use

1. Go to plugin configuration for global settings
2. Configure at least one tile source
3. Enable `GTT` module in a project
4. Define the project boundary in `GTT` project settings
5. Create a new issue with a point, line or polygon

For more information with screenshots see the [Getting Started](doc/getting-started.md) guide.

## Contributing and Support

The GTT Project appreciates any [contributions](https://github.com/gtt-project/.github/blob/main/CONTRIBUTING.md)! Feel free to contact us for [reporting problems and support](https://github.com/gtt-project/.github/blob/main/CONTRIBUTING.md).

## Version History

See [all releases](https://github.com/gtt-project/redmine_gtt/releases) with release notes.

## Authors

- [Jens Kraemer](https://github.com/jkraemer)
- [Daniel Kastl](https://github.com/dkastl)
- [Thibault Mutabazi](https://github.com/eyewritecode)
- [Ko Nagase](https://github.com/sanak)
- ... [and others](https://github.com/gtt-project/redmine_gtt/graphs/contributors)

## LICENSE

This program is free software. See [LICENSE](LICENSE) for more information.
