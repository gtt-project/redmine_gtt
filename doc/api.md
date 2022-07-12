# GTT API

## Global Level API Endpoint
### API Endpoint
```
GET /gtt/settings.json
```
Get all the GTT default settings and also all the global GTT layers data.

***Request***
```
http://localhost:3000/gtt/settings.json
```

***Response***
```json
{
    "gttDefaultSetting": {
        "defaultTrackerIcon": [
            {
                "trackerID": "1",
                "trackerName": "Task",
                "icon": "maki-square"
            },
        ],
        "defaultStatusColor": [
            {
                "statusID": "1",
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
            "GeoJsonUpload": null
        },
        "geocoderSetting": {
            "enableGeocodingOnMap": "true",
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
         "name": "GIS Satellite Map",
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

## Project Level API Endpoint
### API Endpoint
```
GET /projects/{project_identifier}.json
```
Get project and selected GTT layer data of a specific project.

***Request***
```
http://localhost:3000/projects/1.json
```
***Response***
```json
{
    "project": {
        "id": 1,
        "name": "first testing project ",
        "identifier": "first-testing-project",
        "description": "",
        "homepage": "",
        "status": 1,
        "is_public": false,
        "geojson": "",
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
                "created_at": "2022-06-29T09:07:12.574Z",
                "updated_at": "2022-07-05T07:33:09.237Z",
                "global": true,
                "default": true,
                "position": 0,
                "baselayer": true
            }
        ],
        "created_on": "2022-06-29T09:08:38Z",
        "updated_on": "2022-06-29T09:08:38Z"
    }
}
```

