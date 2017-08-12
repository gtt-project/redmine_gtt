/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
var App = (function ($, publ) {

  publ.init = function (options) {

    // Init Map module
    this.map.init({
      target: options.target
    });

    // Hack to disable geometry changes in history
    $( "#history ul.details li:contains('ジオメトリ')").hide();
    $( "#history ul.details li:contains('Geometry')").hide();
    $( "#history ul.details li:contains('Geometrie')").hide();

    return;
  };

  /**
   * Return public objects
   */
  return publ;

})(jQuery, App || {});

/**
 * When DOM is ready, initialize map plugin
 */
$(document).ready(function(){
  // A page may contain more than one map
  $("div.ol-map").each(function(idx) {
    App.init({
      target: this
    });
  });
});
