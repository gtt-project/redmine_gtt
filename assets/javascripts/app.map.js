/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.map = (function ($, publ) {

  var map, defaults, vector;

  /**
   *
   */
  publ.init = function (options) {

    defaults = $("#olmap").data();
    feature = new ol.Feature();

    // Layer for editing vector features
    vector = new ol.layer.Vector({
      source: new ol.source.Vector({
        features: [feature],
        useSpatialIndex: false
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
        attributions: "Maptiles by <a href='http://mierune.co.jp/' target='_blank'>MIERUNE</a>, under CC BY. Data by <a href='http://osm.org/copyright' target='_blank'>OpenStreetMap</a> contributors, under ODbL.",
        crossOrigin: null
      })
    });

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

    if (defaults.edit) {
      this.setControls(defaults.edit.split(' '));
    }
    return;
  };

  /**
   *
   */
  publ.setView = function (options) {

    var view = new ol.View({
      center: ol.proj.fromLonLat([defaults.lon, defaults.lat]),
      zoom: defaults.zoom
    });

    map.setView(view);
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
