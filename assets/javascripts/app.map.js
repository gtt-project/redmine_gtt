/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.map = (function ($, publ) {

  var map, vector, bounds, contents, toolbar, geolocation = null;
  var features = [];

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

    contents = $(options.target).data();
    defaults = $("#ol-defaults").data();

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

    var osm = new ol.layer.Tile({
      title: "OSM",
      baseLayer: true,
      preview: "/plugin_assets/redmine_gtt/images/preview_osm.jpg",
      source: new ol.source.OSM()
    });

    var cmj = new ol.layer.Tile({
      title: "国土地理院",
      baseLayer: true,
      preview: "/plugin_assets/redmine_gtt/images/preview_gsi.png",
      visible: false,
      source: new ol.source.OSM({
        url: "https://cyberjapandata.gsi.go.jp/xyz/std/{z}/{x}/{y}.png",
        attributions: '<a href="https://portal.cyberjapan.jp/help/termsofuse.html" target="_blank">国土地理院</a>',
        crossOrigin: null,
      })
    });

    // Layer for project boundary
    bounds = new ol.layer.Vector({
      title: "Boundaries",
      displayInLayerSwitcher: false,
      source: new ol.source.Vector(),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#29a2e1',
          width: 4
        })
      })
    });

    // Render project boundary if bounds are available
    if (contents.bounds && contents.bounds !== null) {

      var boundary = new ol.format.GeoJSON().readFeature(
        contents.bounds, {
          featureProjection: 'EPSG:3857'
        }
      );
      bounds.getSource().addFeature(boundary);

      cmj.addFilter(new ol.filter.Mask({
        feature: boundary,
        inner: false,
        fill: new ol.style.Fill({ color:[255,255,255,0.4] })
      }));

      osm.addFilter(new ol.filter.Mask({
        feature: boundary,
        inner: false,
        fill: new ol.style.Fill({ color:[255,255,255,0.4] })
      }));
    }

    map = new ol.Map({
      target: options.target,
      layers: [osm,cmj,bounds,vector],
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

    this.setView();
    this.setGeolocation();
    this.setGeocoding();
    this.zoomToExtent();

    // Control button
    var maximizeCtrl = new ol.control.Button({
      html: '<i class="icon-maximize" ></i>',
      title: "Maximize",
      handleClick: function () {
        publ.zoomToExtent();
      }
    });
    toolbar.addControl(maximizeCtrl);

    if (contents.edit) {
      this.setControls(contents.edit.split(' '));
    }
    else if (contents.popup) {
      this.setPopover();
    }

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
        map.updateSize();
      }, 200);
    });

    // Add LayerSwitcher Image Toolbar
  	map.addControl(new ol.control.LayerSwitcherImage());
  };

  publ.getColor = function (feature) {
    // console.log(feature.get("tracker_id"));
    return "navy";
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
          form: "blazon",
          gradient: false,
          glyph: "☀",
          fontSize: 1,
          radius: 15,
          //offsetX: -15,
          rotation: 0,
          rotateWithView: false,
          offsetY: 0,
          color: "white",
          fill: new ol.style.Fill({
            color: publ.getColor(feature)
          }),
          stroke: new ol.style.Stroke({
            color: "white",
            width: 3
          })
        }),
        stroke: new ol.style.Stroke({
          width: 2,
          color: "#f80"
        }),
        fill: new ol.style.Fill({
          color: [255, 136, 0, 0.2]
        })
      })
    );

    return style;

    // return new ol.style.Style({
    //   fill: new ol.style.Fill({
    //     color: 'rgba(255, 255, 255, 0.2)'
    //   }),
    //   stroke: new ol.style.Stroke({
    //     color: '#ffcc33',
    //     width: 4
    //   }),
    //   image: new ol.style.Circle({
    //     radius: 8,
    //     fill: new ol.style.Fill({
    //       color: '#ffcc33'
    //     })
    //   })
    // });
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
  publ.zoomToExtent = function () {
    if (vector.getSource().getFeatures().length > 0) {
      var extent = ol.extent.createEmpty();
      // Because the vector layer is set to "useSpatialIndex": false, we cannot
      // make use of "vector.getSource().getExtent()"
      vector.getSource().getFeatures().forEach(function (feature) {
        ol.extent.extend(extent, feature.getGeometry().getExtent());
      });
      map.getView().fit(extent, map.getSize());
    }
    else if (bounds.getSource().getFeatures().length > 0) {
      map.getView().fit(bounds.getSource().getExtent(), map.getSize());
    }
    else if (geolocation) {
      geolocation.once('change:position', function (error) {
        map.getView().setCenter(geolocation.getPosition());
      });
    }
  };

  /**
   * Add Geolocation functionality
   */
  publ.setGeolocation = function (){

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

  /**
   * Return public objects
   */
  return publ;

})(jQuery, App.map || {});
