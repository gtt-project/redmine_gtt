# Getting Started with GTT plugin

The following is a brief overview of the most important settings of the GTT plugin.

## Plugin Settings

Global settings can be specified in the plugin configuration `/settings/plugin/redmine_gtt`:

![Plugin Settings](Redmine%20GTT%20plugin%20-%20Plugins%20-%20Redmine.png)

**Note:** Geocoder options missing. TBD.

## Tile Source

At least one tile source needs to be configured to be used as a base map. The GTT plugin uses [OpenLayers](https://openlayers.org/) and accepts common OpenLayers layer types and layer options.

![Tile Source](New%20Tile%20Source%20-%20Tile%20Sources%20-%20Redmine.png)

### Example OSM base map

* **Type**: `ol.source.OSM`
* **Options**:

```
{
  "url": "https://tile.openstreetmap.jp/{z}/{x}/{y}.png",
  "custom": "19/34.74701/135.35740",
  "crossOrigin": null,
  "attributions": "<a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
}
```

## My Account

A user can set their own location on the user page `/my/account`:

![My Account](My%20account%20-%20Redmine.png)

## Project Settings

To use GTT in a project the `GTT` module must be enabled `/projects/new`:

![GTT module](New%20project%20-%20Redmine.png)

In the `GTT` tab of the project settings the project boundaries can be specified as a polygon:

![Project settings](Settings%20-%20GTT%20Project%20-%20Redmine.png)

## Creating Issues

Create an issue with a location as `point`, `line` or `polygon`:

![New issue](New%20issue%20-%20GTT%20Project%20-%20Redmine.png)

Changes to an issue, including geometry updates, are available in the issue history:

![History](Issue%201%20-%20GTT%20Project%20-%20Redmine.png)

All issues can be displayed on the projects issues list together with a map:

![All issues](Issues%20-%20GTT%20Project%20-%20Redmine.png)
