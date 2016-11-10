/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.map = (function ($, publ) {

  var map, defaults, vector, bounds = null;
  var features = [];

  /**
   *
   */
  publ.init = function (options) {

    defaults = $("#olmap").data();

    if (defaults.geom && defaults.geom !== null) {
      features = new ol.format.GeoJSON().readFeatures(
        defaults.geom, {
          featureProjection: 'EPSG:3857'
        }
      );
    }

    if (defaults.bounds && defaults.bounds !== null) {
      bounds = new ol.format.GeoJSON().readFeature(
        defaults.bounds, {
          featureProjection: 'EPSG:3857'
        }
      );
    }

    // TODO: this is only necessary because setting the initial form value
    //  through the template causes encoding problems
    publ.updateForm(features);

    // Layer for editing vector features
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

    if (bounds !== null) {
      tiles.addFilter(
        new ol.filter.Mask({
          feature: bounds,
          inner: false,
          fill: new ol.style.Fill({ color:[255,255,255,0.8] })
        })
      );
    }

    map = new ol.Map({
      target: 'olmap',
      layers: [tiles,vector],
      controls: ol.control.defaults({
        attributionOptions: ({
          collapsible: false
        })
      })
    });

    this.setView();
    this.zoomToExtent();

    if (defaults.edit) {
      this.setControls(defaults.edit.split(' '));
    }
    return;
  };

  /**
   *
   */
  publ.setView = function () {

    var view = new ol.View({
      center: ol.proj.fromLonLat([defaults.lon, defaults.lat]),
      zoom: defaults.zoom,
      maxZoom: 18 // applies for Mierune Tiles
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

/**
 * When DOM is ready, initialize the application
 */
$(document).ready(function(){
  App.init({});
});
