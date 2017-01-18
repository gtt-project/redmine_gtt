/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
App.geolocation = (function ($, publ) {

  publ.geolocation = null;

  publ.init = function (options) {

    publ.geolocation = new ol.Geolocation({
      tracking: true,
      projection: this.map.map.getView().getProjection()
    });

    publ.geolocation.on('change', function() {
      // console.log({
      //   accuracy: geolocation.getAccuracy(),
      //   altitude: geolocation.getAltitude(),
      //   altitudeAccuracy: geolocation.getAltitudeAccuracy(),
      //   heading: geolocation.getHeading(),
      //   speed: geolocation.getSpeed()
      // });
    });

    publ.geolocation.on('error', function (error) {
      // TBD
    });

    var accuracyFeature = new ol.Feature();
    publ.geolocation.on('change:accuracyGeometry', function (error) {
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

    publ.geolocation.on('change:position', function (error) {
      var position = geolocation.getPosition();
      positionFeature.setGeometry(position ? new ol.geom.Point(position) : null);
    });

    this.map.map.addLayer(
      new ol.layer.Vector({
        map: this.map.map,
        source: new ol.source.Vector({
          features: [accuracyFeature, positionFeature]
        })
      })
    );

    return;
  };

  /**
   * Return public objects
   */
  return publ;

})(jQuery, App.geolocation || {});
