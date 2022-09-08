import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import FontSymbol from 'ol-ext/style/FontSymbol'

export const gtt_setting = ():void => {

  // Override jQuery UI select menu
  $.widget("ui.selectmenu", $.ui.selectmenu, {
    _renderItem: function( ul: any, item: any ) {
      const li = $('<li>')
      const wrapper = $('<div>', {
        text: ''
      })
      $('<i>', {
        class: "ui-icons material-icons",
        title: item.label,
        text: item.value
      }).prependTo(wrapper)
      return li.append(wrapper).appendTo(ul)
    }
  });

  const glyph = FontSymbol.prototype.defs.glyphs
  document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
    const selectedValue = element.value
    if (element.length === 1 && selectedValue !== "") {
      element.remove(0)
      element.append(new Option("", "", false, false))
    }
    for (let font in FontSymbol.prototype.defs.fonts) {
      for (let i in glyph) {
        if (glyph[i].font == font) {
          const selected = selectedValue === i
          const words = i.split('_')
          const text = words.map((word) => {
            return word[0].toUpperCase() + word.substring(1)
          }).join(" ")
          element.append(new Option(text, i, selected, selected))
          if (selected) {
            element.nextElementSibling.className = "material-icons"
            element.nextElementSibling.textContent = i
          }
        }
      }
    }

    // Apply better Selector styling with jQuery UI (available in Redmine)
    $(element)
      .selectmenu({
        change: function(event: any, data: any) {
          console.log(data.item.value)
          document.querySelector(`#icon_${element.id}`).textContent = data.item.value
        }
      })
      .selectmenu('menuWidget')
      .addClass('select-overflow')
      .addClass('ui-menu-icons customicons')
  })

  // document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
  //   element.addEventListener('change', (ev) => {
  //     const currentTarget = ev.currentTarget as HTMLSelectElement
  //     const trackerId = currentTarget.id
  //     document.querySelector(`#icon_${trackerId}`).className = "material-icons"
  //     document.querySelector(`#icon_${trackerId}`).textContent = currentTarget.value
  //   })
  // })
}
