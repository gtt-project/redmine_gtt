/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
var App = (function ($, publ) {

  ol.style.FontSymbol.addDefs
  ( "mcr-icons", {
    "mcr-icon-bulp": "\uf101",
    "mcr-icon-douro": "\uf102",
    "mcr-icon-gomi": "\uf103",
    "mcr-icon-kaiketsu": "\uf104",
    "mcr-icon-kouen": "\uf105",
    "mcr-icon-kyoudou": "\uf106",
    "mcr-icon-park": "\uf107",
    "mcr-icon-pen": "\uf108",
    "mcr-icon-river": "\uf109",
    "mcr-icon-road": "\uf10a",
    "mcr-icon-street": "\uf10b",
    "mcr-icon-theme_report": "\uf10c",
    "mcr-icon-trash": "\uf10d",
    "mcr-icon-write": "\uf10e"
  });

  var map, vector, bounds, contents, toolbar, geolocation = null;
  var maps = [];
  var features = [];
  var layerArr = [];
  var filters = {
    location: false,
    distance: false
  };

  // Quick hack
  var quick_hack = {
    lon: 135.1955,
    lat: 34.6901,
    zoom: 13,
    maxzoom: 18
  };

  /**
   *
   */
  publ.init = function (options) {

    map = null;
    vector = null;
    bounds = null;
    toolbar = null;
    geolocation = null;

    features = [];
    layerArr = [];

    contents = $(options.target).data();
    defaults = $("#ol-defaults").data();
    defaults.geocoderUrl = "https://geocoder.grp.one/geojson";

    if (defaults.lon === null) {
      defaults.lon = quick_hack.lon;
    }
    if (defaults.lat === null) {
      defaults.lat = quick_hack.lat;
    }
    if (defaults.zoom === null) {
      defaults.zoom = quick_hack.zoom;
    }
    if (defaults.maxzoom === null) {
      defaults.maxzoom = quick_hack.maxzoom;
    }

    if (contents.geom && contents.geom !== null) {
      features = new ol.format.GeoJSON().readFeatures(
        contents.geom, {
          featureProjection: 'EPSG:3857'
        }
      );
    }

    // TODO: this is only necessary because setting the initial form value
    //  through the template causes encoding problems
    publ.updateForm(features);

    contents.layers.forEach(function(layer,idx) {
      var s = layer.type.split(".");
      var l = new ol.layer.Tile({
        lid: layer.id,
        title: layer.name,
        baseLayer: true,
        visible: false,
        source: new ol[s[1]][s[2]](layer.options)
      });
      l.on("change:visible", function(e) {
        if (e.target.getVisible()) {
          document.cookie = "_redmine_gtt_basemap=" +
                            e.target.get("lid") + ";path=/";
        }
      });
      layerArr.push(l);
    });
    publ.setBasemap(layerArr);

    // Layer for project boundary
    bounds = new ol.layer.Vector({
      title: "Boundaries",
      displayInLayerSwitcher: false,
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255,255,255,0.0)'
        }),
        stroke: new ol.style.Stroke({
          color: 'rgba(220,26,26,0.7)',
          // lineDash: [12,1,12],
          width: 1
        })
      })
    });
    layerArr.push(bounds);

    // Layer for vector features
    vector = new ol.layer.Vector({
      title: "Features",
      displayInLayerSwitcher: false,
      source: new ol.source.Vector({
        "features": features,
        "useSpatialIndex": false
      }),
      renderOrder: ol.ordering.yOrdering(),
      style: this.getStyle
    });
    layerArr.push(vector);

    // Render project boundary if bounds are available
    if (contents.bounds && contents.bounds !== null) {

      var boundary = new ol.format.GeoJSON().readFeature(
        contents.bounds, {
          featureProjection: 'EPSG:3857'
        }
      );
      bounds.getSource().addFeature(boundary);

      layerArr.forEach(function(layer) {
        if(layer.get("baseLayer")) {
          layer.addFilter(new ol.filter.Mask({
            feature: boundary,
            inner: false,
            fill: new ol.style.Fill({ color:[220,26,26,.1]})
          }));
        }
      });
    }

    map = new ol.Map({
      target: options.target,
      layers: layerArr,
      controls: ol.control.defaults({
        attributionOptions: ({
          collapsible: false
        })
      })
    });

    // Add Toolbar
    toolbar = new ol.control.Bar();
    toolbar.setPosition("bottom-left");
    map.addControl(toolbar);

    // this.setView();
    this.setGeolocation();
    this.setGeocoding();
    this.parseHistory();

    // Control button
    var maximizeCtrl = new ol.control.Button({
      html: '<i class="icon-maximize" ></i>',
      title: "Maximize",
      handleClick: function () {
        publ.zoomToExtent(true);
      }
    });
    toolbar.addControl(maximizeCtrl);

    if (contents.edit) {
      this.setControls(contents.edit.split(' '));
    }
    else if (contents.popup) {
      this.setPopover();
    }

    // Sidebar hack
    $("#sidebar").on('hideSidebar', function (evt) {
      maps.forEach(function (m) {
        m.updateSize();
      });
    })

    // When one or more issues is selected, zoom to selected map features
    $("table.issues tbody tr").on('click', function (evt) {
      var id = $(this).attr("id").split('-')[1];
      var feature = vector.getSource().getFeatureById(id);
      map.getView().fit(feature.getGeometry(), map.getSize());
    });

    // Need to update size of an invisible map, when the editable form is made
    // visible. This doesn't look like a good way to do it, but this is more of
    // a Redmine problem
    $("div.contextual a.icon-edit").on('click', function (evt) {
      setTimeout( function() {
        maps.forEach(function (m) {
          m.updateSize();
        });
      }, 200);
    });

    // Redraw the map, when a GTT Tab gets activated
    $("#tab-gtt").click(function(){
      maps.forEach(function (m) {
        m.updateSize();
      });
      publ.zoomToExtent();
    });

    // Add LayerSwitcher Image Toolbar
    map.addControl(new ol.control.LayerPopup());

    // Because Redmine filter functions are applied later, the Window onload
    // event provides a workaround to have filters loaded before executing
    // the following code
    $(window).bind('load', function() {
      if ($("tr#tr_bbox").length > 0) {
        filters.location = true;
      }
      if ($("tr#tr_distance").length > 0) {
        filters.distance = true;
      }
      $("fieldset#location legend").click(function(){
        toggleAndLoadMap(this)
      })
      publ.zoomToExtent();
      map.on('moveend', publ.updateFilter);
    });

    // To fix an issue with empty map after changing the tracker type
    $('select#issue_tracker_id').on('change', function(evt) {
      $(document).ajaxComplete(function(d){
        publ.zoomToExtent(true)
      })
    });

    // To fix an issue with empty map after changing the status
    $('select#issue_status_id').on('change', function(evt) {
      $(document).ajaxComplete(function(d){
        publ.zoomToExtent(true)
      })
    });

    // To fix an issue with empty map after changing the project
    $('select#issue_project_id').on('change', function(evt) {
      $(document).ajaxComplete(function(d){
        publ.zoomToExtent(true)
      })
    });

    // Handle multiple maps per page
    maps.push(map);
  };

  /**
   * Decide which baselayer to show
   */
  publ.setBasemap = function (layers) {

    if (layers.length === 0) {
      console.error("There is no baselayer available!");
      return;
    }

    var index = 0;
    var cookie = parseInt(
      getCookie("_redmine_gtt_basemap")
    );

    if (cookie) {
      var lid = 0;
      // Check if layer ID exists in available layers
      layers.forEach(function(layer){
        if (cookie === layer.get("lid")) {
          lid = cookie;
        }
      });

      // Set selected layer visible
      layers.forEach(function(layer,idx){
        if (lid === layer.get("lid")) {
          index = idx;
        }
      });
    }

    // Set layer visible
    layers[index].setVisible(true);
  };

  publ.getColor = function (feature) {
    color = "#FFD700";
    var plugin_settings = defaults.pluginSettings

    var status_id = feature.get('status_id');
    if (status_id) {
      var key = "status_" + status_id;
      if (key in plugin_settings) {
        color = plugin_settings[key];
      }
    }
    return color;
  };
  
  publ.getFontColor = function (feature) {
    color = "#FFFFFF"
    return color;
  };

  publ.getSymbol = function (feature) {
    var symbol = "mcr-icon-write";

    var plugin_settings = $("#ol-defaults").data("pluginSettings");
    var tracker_id = feature.get('tracker_id');
    if (tracker_id) {
      var key = "tracker_" + tracker_id;
      if (key in plugin_settings) {
        symbol = plugin_settings[key];
      }
    }

    return symbol;
  };

  publ.getStyle = function (feature,resolution) {
    var style= [];
    var glyph = ol.style.FontSymbol.prototype.defs.glyphs;

    // Apply Shadow
    style.push(
      new ol.style.Style({
        image: new ol.style.Shadow({
          radius: 15,
          blur: 5,
          offsetX: 0,
          offsetY: 0,
          fill: new ol.style.Fill({
            color: "rgba(0,0,0,0.5)"
          })
        })
      })
    );

    // Apply Font Style
    style.push(
      new ol.style.Style({
        image: new ol.style.FontSymbol({
          form: "mcr",
          gradient: false,
          glyph: publ.getSymbol(feature),
          fontSize: 0.7,
          radius: 18,
          offsetY: -9,
          rotation: 0,
          rotateWithView: false,
          color: publ.getFontColor(feature),
          fill: new ol.style.Fill({
            color: publ.getColor(feature)
          }),
          stroke: new ol.style.Stroke({
            color: "#333333",
            width: 1
          })
        }),
        stroke: new ol.style.Stroke({
          width: 4,
          color: publ.getColor(feature)
        }),
        fill: new ol.style.Fill({
          color: [255, 136, 0, 0.2]
        })
      })
    );

    return style;
  };

  /**
   *
   */
  publ.setView = function () {

    var view = new ol.View({
      center: ol.proj.fromLonLat([defaults.lon, defaults.lat]),
      zoom: defaults.zoom,
      maxZoom: defaults.maxzoom // applies for Mierune Tiles
    });

    map.setView(view);
  };

  /**
   *
   */
  publ.zoomToExtent = function (force) {
    if (!force && (filters.distance || filters.location)) {
      // Do not zoom to extent but show the previous extent stored as cookie
      var parts = (getCookie("_redmine_gtt_permalink")).split("/");
      maps.forEach(function (m) {
        m.getView().setZoom(parseInt(parts[0], 10));
        m.getView().setCenter(ol.proj.transform([
          parseFloat(parts[1]),
          parseFloat(parts[2])
        ],'EPSG:4326','EPSG:3857'));
        m.getView().setRotation(parseFloat(parts[3]));
      })
    }
    else if (vector.getSource().getFeatures().length > 0) {
      var extent = ol.extent.createEmpty();
      // Because the vector layer is set to "useSpatialIndex": false, we cannot
      // make use of "vector.getSource().getExtent()"
      vector.getSource().getFeatures().forEach(function (feature) {
        ol.extent.extend(extent, feature.getGeometry().getExtent());
      });
      maps.forEach(function (m) {
        m.getView().setMaxZoom(18);
        m.getView().fit(extent, m.getSize());
      });
    }
    else if (bounds.getSource().getFeatures().length > 0) {
      maps.forEach(function (m) {
        m.getView().fit(bounds.getSource().getExtent(), m.getSize());
      });
    }
    else if (geolocation) {
      geolocation.once('change:position', function (error) {
        maps.forEach(function (m) {
          m.getView().setCenter(geolocation.getPosition());
        });
      });
    }
  };

  /**
   *  Updates map settings for Redmine filter
   */
  publ.updateFilter = function () {
    var center = map.getView().getCenter();
    var extent = map.getView().calculateExtent(map.getSize());

    center = ol.proj.transform(center,'EPSG:3857','EPSG:4326');
    // console.log("Map Center (WGS84): ", center);
    $('fieldset#location').data('center', center);
    $('#tr_distance #values_distance_3').val(center[0]);
    $('#tr_distance #values_distance_4').val(center[1]);

    // Set Permalink as Cookie
    var cookie = [];
    var hash = map.getView().getZoom() + '/' +
      Math.round(center[0] * 1000000) / 1000000 + '/' +
      Math.round(center[1] * 1000000) / 1000000 + '/' +
      map.getView().getRotation();
    cookie.push("_redmine_gtt_permalink=" + hash);
    cookie.push("path=" + window.location.pathname);
    document.cookie = cookie.join(";");

    extent = ol.proj.transformExtent(extent,'EPSG:3857','EPSG:4326').join('|');
    // console.log("Map Extent (WGS84): ",extent);
    $('select[name="v[bbox][]"]').find('option').first().val(extent);
    // adjust the value of the 'On map' option tag
    // Also adjust the JSON data that's the basis for building the filter row
    // html (this is relevant if the map is moved first and then the filter is
    // added.)
    if(window.availableFilters && window.availableFilters.bbox) {
      window.availableFilters.bbox.values = [['On map', extent]];
    }
  },


  /**
   * Parse page for WKT strings in history
   */
  publ.parseHistory = function () {
    $('div#history ul.details i').each( function (idx,item) {
      var regex = new RegExp(/\w+[\s]?(\((-?\d+.\d+\s?-?\d+.\d+,?)+\))+/g);
      var match = $(item).text().match(regex);
      if (match !== null) {
        var feature = new ol.format.WKT().readFeature(
          match[0], {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857'
          }
        );
        var wkt = new ol.format.WKT().writeFeature(
          feature, {
            dataProjection: 'EPSG:4326',
            featureProjection: 'EPSG:3857',
            decimals: 6
          }
        );
        $(item).html('<a href="#" onclick="event.preventDefault();" class="wkt">' + wkt + '</a>');
      }
    });
  };

  /**
   * Add Geolocation functionality
   */
  publ.setGeolocation = function () {

    geolocation = new ol.Geolocation({
      tracking: false,
      projection: map.getView().getProjection()
    });

    geolocation.on('change', function() {
      // console.log({
      //   accuracy: geolocation.getAccuracy(),
      //   altitude: geolocation.getAltitude(),
      //   altitudeAccuracy: geolocation.getAltitudeAccuracy(),
      //   heading: geolocation.getHeading(),
      //   speed: geolocation.getSpeed()
      // });
    });

    geolocation.on('error', function (error) {
      // TBD
    });

    var accuracyFeature = new ol.Feature();
    geolocation.on('change:accuracyGeometry', function (error) {
      accuracyFeature.setGeometry(geolocation.getAccuracyGeometry());
    });

    var positionFeature = new ol.Feature();
    positionFeature.setStyle(new ol.style.Style({
      image: new ol.style.Circle({
        radius: 6,
        fill: new ol.style.Fill({
          color: '#3399CC'
        }),
        stroke: new ol.style.Stroke({
          color: '#fff',
          width: 2
        })
      })
    }));

    geolocation.on('change:position', function (error) {
      var position = geolocation.getPosition();
      positionFeature.setGeometry(position ? new ol.geom.Point(position) : null);
    });

    var geolocationLayer = new ol.layer.Vector({
      displayInLayerSwitcher: false,
      map: map,
      source: new ol.source.Vector({
        features: [accuracyFeature, positionFeature]
      })
    });
    map.addLayer(geolocationLayer);

    // Control button
    var geolocationCtrl = new ol.control.Toggle({
      html: '<i class="icon-compass" ></i>',
      title: "Geolocation",
      active: false,
      onToggle: function (active) {
        geolocation.setTracking(active);
        geolocationLayer.setVisible(active);
        if (active) {
          map.getView().setCenter(geolocation.getPosition());
        }
      }
    });
    toolbar.addControl(geolocationCtrl);
  };

  /**
   * Add Geocoding functionality
   */
  publ.setGeocoding = function (){

    // Hack to add Geocoding buttons to text fields
    // There should be a better way to do this
    if ( $("#issue-form #attributes button.btn-geocode").length == 0 ) {
      $("#issue-form #attributes label:contains('現地住所')").parent("p").append(
        '<button name="button" type="button" class="btn-geocode">住所検索</button>'
      );

      $("button.btn-geocode").on("click", function(evt) {
        if (vector.getSource().getFeatures().length > 0) {
          var coords = null
          vector.getSource().getFeatures().forEach(function (feature) {
            // Todo: only works with point geometries for now for the last geometry
            coords = feature.getGeometry().getCoordinates();
          });
          coords = ol.proj.transform(coords,'EPSG:3857','EPSG:4326')
          $.getJSON("https://geocoder.grp.one/reversegeocode/json/" + coords.join(",") + ",1000", function(data) {
            if (data.result.address) {
              $("#issue-form #attributes label:contains('現地住所')").parent("p").children("input").val(data.result.address);
            }
            else {
              $("#issue-form #attributes label:contains('現地住所')").parent("p").children("input").val("---");
            }
          });
        }
      });

    }

    if ( $("#issue-form #attributes button.btn-parksearch").length == 0 ) {
      $("#issue-form #attributes label:contains('公園検索')").parent("p").append(
        '<button name="button" type="button" class="btn-parksearch">公園検索</button>'
      );

      $("button.btn-parksearch").on("click", function(evt) {
        if (vector.getSource().getFeatures().length > 0) {
          var coords = null
          vector.getSource().getFeatures().forEach(function (feature) {
            // Todo: only works with point geometries for now for the last geometry
            coords = feature.getGeometry().getCoordinates();
          });
          coords = ol.proj.transform(coords,'EPSG:3857','EPSG:4326')
          $.getJSON("https://geofuse.georepublic.org/geocoder/service/reversegeocode/json/" + coords.join(",") + ",500?useaddr=true&owner=chiba&details=true", function(data) {
            if (data.result.address && data.result.details.id ) {
              $("#issue-form #attributes label:contains('公園検索')").parent("p").children("input").val(
                "[" + data.result.details.id + "] " + data.result.address
              );
            }
            else {
              $("#issue-form #attributes label:contains('公園検索')").parent("p").children("input").val("---");
            }
          });
        }
      });
    }

    // Control button
    var geocodingCtrl = new ol.control.Toggle({
      html: '<i class="icon-info" ></i>',
      title: "Geocoding",
      className: "ctl-geocoding",
      onToggle: function (active) {
        if (active) {
          $(".ctl-geocoding button input").focus();
        }
      },
      bar: new ol.control.Bar({
        controls: [
          new ol.control.Button({
            html: '<form><input name="address" type="text" /></form>'
          })
        ]
      })
    });
    toolbar.addControl(geocodingCtrl);

    // Make Geocoding API request
    $(".ctl-geocoding form").submit(function (evt) {
      evt.preventDefault();

      if (!defaults.geocoderUrl) {
        throw new Error ("No Geocoding service configured!");
      }

      var url = [
        defaults.geocoderUrl,
        ($(this).serializeArray())[0].value
      ];

      $.getJSON(url.join("/"), function(geojson) {
        // TODO, check for valid results
        var address = new ol.format.GeoJSON().readFeature(
          geojson, {
            featureProjection: 'EPSG:3857'
          }
        );
        map.getView().fit(address.getGeometry().getExtent(), map.getSize());
      });
    });
  };

  /**
   *  Add editing tools
   */
  publ.setControls = function (types) {

    // Make vector features editable
    var modify = new ol.interaction.Modify({
      features: (vector.getSource()).getFeaturesCollection()
    });

    modify.on('modifyend', function(evt) {
      this.updateForm(evt.features.getArray());
    }, publ);

    map.addInteraction(modify);

    // Add Controlbar
    var mainbar = new ol.control.Bar();
    mainbar.setPosition("top-left");
    map.addControl(mainbar);

    var editbar = new ol.control.Bar({
      toggleOne: true,	// one control active at the same time
			group: true			  // group controls together
		});
		mainbar.addControl(editbar);

    types.forEach(function(type) {
      var draw = new ol.interaction.Draw({
        type: type,
        source: vector.getSource()
      });

      draw.on('drawend', function(evt) {
        (vector.getSource()).clear();
        publ.updateForm([evt.feature]);
      });

      var control = new ol.control.Toggle({
        html: '<i class="icon-' + type.toLowerCase() + '" ></i>',
        title: type,
        interaction: draw
      });
      editbar.addControl(control);
    });

    // Upload button
    editbar.addControl(new ol.control.Button({
      html: '<i class="icon-book" ></i>',
      title: 'Upload GeoJSON',
      handleClick: function () {
        var data = prompt("Please paste a GeoJSON geometry here");
        if (data !== null) {
          var features = new ol.format.GeoJSON().readFeatures(
            JSON.parse(data), {
              featureProjection: 'EPSG:3857'
            }
          );
          (vector.getSource()).clear();
          (vector.getSource()).addFeatures(features);
          publ.updateForm(features);
          publ.zoomToExtent();
        }
      }
    }));

    var controls = editbar.getControls();
    controls[0].setActive(true);
  };

  /**
   *
   */
  publ.setPopover = function () {

	  var popup = new ol.Overlay.Popup ({
      popupClass: "default", //"tooltips", "warning" "black" "default", "tips", "shadow",
			closeBox: true,
			onclose: function(){},
			positioning: 'auto',
			autoPan: true,
      autoPanAnimation: { duration: 250 }
		});
    map.addOverlay(popup);

    // Control Select
    var select = new ol.interaction.Select({
      layers: [vector],
      multi: false
    });
    map.addInteraction(select);

    // On selected => show/hide popup
    select.getFeatures().on(['add'], function (evt){
      var feature = evt.element;

      var content = [];
      content.push('<b>' + feature.get("subject") + '</b><br/>');
      // content.push('<span>Starts at: ' + feature.get("start_date") + '</span> |');

      var url = contents.popup.href.replace(/\[(.+?)\]/g, feature.get('id'));
      content.push('<a href="' + url + '">Edit</a>');

      popup.show(feature.getGeometry().getCoordinates(), content.join(' '));
    });

    select.getFeatures().on(['remove'], function (evt) {
      popup.hide();
    });

    // change mouse cursor when over marker
    map.on('pointermove', function(evt) {
      if (evt.dragging) return;
      var hit = map.hasFeatureAtPixel(evt.pixel, {
        layerFilter: function(layer) {
          return layer === vector;
        }
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
  };

  /**
   *
   */
  publ.updateForm = function (features) {
    var writer = new ol.format.GeoJSON();
    var geojson = JSON.parse(writer.writeFeatures(features, {
      featureProjection: 'EPSG:3857',
      dataProjection: 'EPSG:4326'
    }));
    $("#geom").val(JSON.stringify(geojson.features[0]));
  };

  publ.getScale = function () {
    // Always use 1st subject map
    var m = maps[0];
    var resolution = m.getView().getResolution();
    var units = map.getView().getProjection().getUnits();
    var dpi = 25.4 / 0.28;
    var mpu = ol.proj.METERS_PER_UNIT[units];
    var inchesPerMeter = 39.37;
    return resolution * (mpu * inchesPerMeter * dpi);
  };

  publ.getBasemapUrl = function () {
    // Always use 1st subject map
    var m = maps[0];
    var layers = m.getLayers();
    if (layers.getLength() === 0) {
      console.error("There is no baselayer available!");
      return;
    }

    var index = 0;
    var cookie = parseInt(
      getCookie("_redmine_gtt_basemap")
    );

    if (cookie) {
      var lid = 0;
      // Check if layer ID exists in available layers
      layers.forEach(function(layer){
        if (cookie === layer.get("lid")) {
          lid = cookie;
        }
      });

      // Get selected layer index
      layers.forEach(function(layer,idx){
        if (lid === layer.get("lid")) {
          index = idx;
        }
      });
    }

    // Get layer url
    var layer = layers.getArray()[index];
    var url = layer.getSource().getUrls()[0];
    //console.log(url);
    return url;
  };

  function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for(var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
  }

  function toggleAndLoadMap(el) {
    var fieldset = $(el).parents('fieldset').first();
    fieldset.toggleClass('collapsed');
    fieldset.children('div').toggle();
    maps.forEach(function (m) {
      m.updateSize();
    });
  }

  /**
   * Return public objects
   */
  return publ;

})(jQuery, App || {});

/**
 * Extend core Redmine's buildFilterRow method
 */
window.buildFilterRowWithoutDistanceFilter = window.buildFilterRow;
window.buildFilterRow = function(field, operator, values) {
  if(field == 'distance') {
    buildDistanceFilterRow(operator, values);
  } else {
    buildFilterRowWithoutDistanceFilter(field, operator, values);
  }
};

function buildDistanceFilterRow(operator, values){
  var field = 'distance';
  var fieldId = field;
  var filterTable = $("#filters-table");
  var filterOptions = availableFilters[field];
  if (!filterOptions) return;
  var operators = operatorByType[filterOptions['type']];
  var filterValues = filterOptions['values'];
  var i, select;

  var tr = $('<tr class="filter">').attr('id', 'tr_'+fieldId).html(
    '<td class="field"><input checked="checked" id="cb_'+fieldId+'" name="f[]" value="'+field+'" type="checkbox"><label for="cb_'+fieldId+'"> '+filterOptions['name']+'</label></td>' +
    '<td class="operator"><select id="operators_'+fieldId+'" name="op['+field+']"></td>' +
    '<td class="values"></td>'
  );
  filterTable.append(tr);

  select = tr.find('td.operator select');
  for (i = 0; i < operators.length; i++) {
    var option = $('<option>').val(operators[i]).text(operatorLabels[operators[i]]);
    if (operators[i] == operator) { option.attr('selected', true); }
    select.append(option);
  }
  select.change(function(){ toggleOperator(field); });

  tr.find('td.values').append(
    '<span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'_1" size="14" class="value" /></span>' +
    ' <span style="display:none;"><input type="text" name="v['+field+'][]" id="values_'+fieldId+'_2" size="14" class="value" /></span>' +
    '<input type="hidden" name="v['+field+'][]" id="values_'+fieldId+'_3" />' +
    '<input type="hidden" name="v['+field+'][]" id="values_'+fieldId+'_4" />'
  );
  $('#values_'+fieldId+'_1').val(values[0]);
  var base_idx = 1;
  if(values.length == 2 || values.length == 4) {
    // upper bound for 'between' operator
    $('#values_'+fieldId+'_2').val(values[1]);
    base_idx = 2;
  }
  var x,y;
  if(values.length > 2){
    // console.log('distance center point from values: ', values[base_idx], values[base_idx+1]);
    x = values[base_idx];
    y = values[base_idx+1];
  } else {
    // console.log('taking distance from map fieldset: ', $('fieldset#location').data('center'));
    var xy = $('fieldset#location').data('center');
    x = xy[0]; y = xy[1];
  }
  $('#values_'+fieldId+'_3').val(x);
  $('#values_'+fieldId+'_4').val(y);
}
