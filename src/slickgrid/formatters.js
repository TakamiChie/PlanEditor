/**
 * アプリ動作用のカスタムフォーマッタ群
 * @author TakamiChie
 */

(function ($) {
  // register namespace
  $.extend(true, window, {
    "Slick": {
      "Formatters": {
        "LocaleSupportedDate": LSDateFormatter,
      }
    }
  });

  function LSDateFormatter(row, cell, value, columnDef, dataContext) {
    let r = "";
    if(value){
      try {
        let d = new Date(value); 
        r = d.toLocaleDateString(navigator.language);
      } catch (error) {
        r = value;
      }
    }
    return r;
  }
})(jQuery);
