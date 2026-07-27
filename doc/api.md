# GTT API

The plugin extends Redmine's REST API. Authentication works as in core
Redmine (API key via `key=` parameter or `X-Redmine-API-Key` header).

## Spatial filters and sorting (issues API)

Issues can be filtered and sorted spatially through the standard issues API.
The filters are available on **project-scoped** queries when the GTT module
is enabled in that project:

```text
GET /projects/:project_id/issues.json
```

The global `/issues.json` endpoint does not offer them. Coordinates are
WGS84 (EPSG:4326) longitude/latitude; distances are meters.

### Filter by distance

Short parameter format: `distance=<operator><meters>|<lng>|<lat>`

```text
# issues within 1 km of a point
GET /projects/demo/issues.json?distance=<=1000|139.7|35.69

# issues farther than 1 km from a point
GET /projects/demo/issues.json?distance=>=1000|139.7|35.69

# issues between 10 m and 1 km (between operator; min|max|lng|lat)
GET /projects/demo/issues.json?distance=><10|1000|139.7|35.69

# issues with any geometry / with no geometry
GET /projects/demo/issues.json?distance=*
GET /projects/demo/issues.json?distance=!*
```

(Remember to URL-encode the operator characters: `<=` → `%3C%3D`, `|` → `%7C`.)

While a distance filter is active, each issue in the response carries a
`distance` attribute (meters from the filter's center point).

### Filter by bounding box

Short parameter format: `bbox==<lng1>|<lat1>|<lng2>|<lat2>` (two corners of
the box; the leading `=` is the operator). Matching uses intersection, so
lines and polygons crossing the box are found too. `!` instead of `=`
inverts the filter (everything outside the box).

```text
GET /projects/demo/issues.json?bbox==123.19|9.25|123.33|9.36
```

### Web-UI parameter format

The explicit filter syntax used by the web UI works as well, e.g. the
"outside the box" query:

```text
GET /projects/demo/issues.json?set_filter=1&f[]=bbox&op[bbox]=!&v[bbox][]=123.19|9.25|123.33|9.36
```

### Sort by distance

With an active distance filter, `sort=distance` (or `sort=distance:desc`)
orders the result by distance from the filter's center point:

```text
GET /projects/demo/issues.json?distance=<=100000|139.7|35.69&sort=distance
```

## Global Level API Endpoint

### Plugin settings API Endpoint

```text
GET /gtt/settings.json
```

Get all the GTT default settings and also all the global GTT layers data.

***Request***

```text
http://localhost:3000/gtt/settings.json
```

***Response***

```json
{
    "gttDefaultSetting": {
        "defaultTrackerIcon": [
            {
                "trackerID": 1,
                "trackerName": "Task",
                "icon": "{\"id\":\"shape:square\",\"svg\":\"<svg viewBox=\\\"0 0 24 24\\\">...</svg>\"}"
            },
        ],
        "defaultStatusColor": [
            {
                "statusID": 1,
                "statusName": "New",
                "color": "#00ff00"
            },
        ],
        "defaultMapSetting": {
            "centerLng": "135.35740",
            "centerLat": "34.74701"
        },
        "geometrySetting": {
            "geometryTypes": [
                "Point",
                "LineString",
                "Polygon"
            ],
            "GeoJsonUpload": false
        },
        "geocoderSetting": {
            "enableGeocodingOnMap": true,
            "geocoderOptions": "{}"
        }
    },
    "gttLayer": [
      {
         "id": 1,
         "name": "OSM",
         "type": "ol.source.OSM",
         "options": {
             "url": "https://tile.openstreetmap.jp/{z}/{x}/{y}.png",
             "custom": "17/34.74701/135.35740",
             "crossOrigin": null,
             "attributions": "<a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
         },
      },
      {
         "id": 2,
         "name": "Satellite Map",
         "type": "ol.source.XYZ",
         "options": {
             "url": "https://cyberjapandata.gsi.go.jp/xyz/seamlessphoto/{z}/{x}/{y}.jpg",
             "maxZoom": 18,
             "minZoom": 0,
             "attributions": "<a href=\"https://portal.cyberjapan.jp/help/termsofuse.html\" target=\"_blank\">GISSateliteMap</a>"
         },
       }
    ]
}
```
