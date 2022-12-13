# GTT API

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
                "icon": "maki-square"
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
