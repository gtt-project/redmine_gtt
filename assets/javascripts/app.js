/**
 * [description]
 * @param  {[type]} $     [description]
 * @param  {[type]} publ  [description]
 * @return {[type]}       [description]
 */
var App = (function ($, publ) {

  publ.init = function (options) {

    // Init Map module
    if ($("#olmap").length) {
      this.map.init();
    }

    return;
  };

  /**
   * Return public objects
   */
  return publ;

})(jQuery, App || {});
