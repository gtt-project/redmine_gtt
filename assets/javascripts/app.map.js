/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.map = (function ($, publ) {

  var map, view;

  publ.init = function (options) {

    var m = $("#olmap");

    map = new ol.Map({
      target: 'olmap',
      layers: [
        new ol.layer.Tile({
          source: new ol.source.OSM()
        })
      ],
      view: new ol.View()
    });

    view = new ol.View({
      center: ol.proj.fromLonLat([m.data('lon'), m.data('lat')]),
      zoom: m.data('zoom')
    });

    map.setView(view);
    return;
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
