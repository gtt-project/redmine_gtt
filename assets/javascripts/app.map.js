/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.map = (function ($, publ) {

  var map, vector, bounds, defaults, contents = null;
  var features = [];

  /**
   *
   */
  publ.init = function (options) {

    contents = $(options.target).data();
    defaults = $("#ol-defaults").data();

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
      source: new ol.source.Vector({
        "features": features,
        "useSpatialIndex": false
      }),
      style: new ol.style.Style({
        fill: new ol.style.Fill({
          color: 'rgba(255, 255, 255, 0.2)'
        }),
        stroke: new ol.style.Stroke({
          color: '#ffcc33',
          width: 4
        }),
        image: new ol.style.Circle({
          radius: 8,
          fill: new ol.style.Fill({
            color: '#ffcc33'
          })
        })
      })
    });

    // Layer for project boundary
    bounds = new ol.layer.Vector({
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

    var tiles = new ol.layer.Tile({
      source: new ol.source.OSM({
        url: "https://tile.mierune.co.jp/mierune_mono/{z}/{x}/{y}.png",
        attributions: "Maptiles by <a href='http://mierune.co.jp/' " +
          "target='_blank'>MIERUNE</a>, under CC BY. Data by <a " +
          "href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> " +
          "contributors, under ODbL.",
        crossOrigin: null
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

      tiles.addFilter(
        new ol.filter.Mask({
          feature: boundary,
          inner: false,
          fill: new ol.style.Fill({ color:[255,255,255,0.8] })
        })
      );
    }

    map = new ol.Map({
      target: options.target,
      layers: [tiles,bounds,vector],
      controls: ol.control.defaults({
        attributionOptions: ({
          collapsible: false
        })
      })
    });

    this.setView();
    this.zoomToExtent();

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

    return;
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

    var controls = editbar.getControls();
    controls[0].setActive(true);
  };

  /**
   *
   */
  publ.setPopover = function () {

    var overlay = new ol.Overlay({
      element: document.getElementById('popup'),
      autoPan: true,
      autoPanAnimation: {
        duration: 250
      }
    });
    map.addOverlay(overlay);

    $('#popup-closer').bind('click', function(evt) {
      publ.unsetPopover(overlay,this);
    });

    // display popup on click
    map.on('singleclick', function(evt) {
      var feature = map.forEachFeatureAtPixel(evt.pixel,
        function(feature, layer) {
          return feature;
        }, null, function (layer) {
          // Only return fatures from layer "vector"
          return layer === vector;
        }
      );

      if (feature) {
        // TODO: Localize the popup and make it look better
        var url = contents.popup.href.replace(/\[(.+?)\]/g, feature.get('id'))
        $('#popup-content').html('<a href="' + url + '">Edit</a>');
        overlay.setPosition(evt.coordinate);
      }
      else {
        publ.unsetPopover(overlay,$('#popup-closer'));
      }
    });

    // change mouse cursor when over marker
    map.on('pointermove', function(evt) {
      if (evt.dragging) return;
      var hit = map.hasFeatureAtPixel(evt.pixel, function(layer) {
        return layer === vector;
      });
      map.getTargetElement().style.cursor = hit ? 'pointer' : '';
    });
  };

  publ.unsetPopover = function (layer,close) {
    layer.setPosition(undefined);
    close.blur();
    return false;
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
