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
      const style = item.optgroup.toLowerCase().split(' ').join('-')
      switch (style) {
        case 'material-icons':
          $('<i>', {
            class: "ui-icons " + style,
            title: item.label,
            text: item.value
          }).prependTo(wrapper)
          break;

        default:
          $('<i>', {
            class: "ui-icons icon-" + item.value,
            title: item.label
          }).prependTo(wrapper)
          break;
      }
      return li.append(wrapper).appendTo(ul)
    }
  });

  const glyph = FontSymbol.prototype.defs.glyphs
  document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
    const selectedValue = element.value
    if (element.length === 1 && selectedValue !== "") {
      element.remove(0)
      // element.append(new Option("", "", false, false))
    }
    for (let font in FontSymbol.prototype.defs.fonts) {
      const optgroup = document.createElement('optgroup')
      optgroup.label = font
      for (let i in glyph) {
        if (glyph[i].font == font) {
          const selected = selectedValue === i
          const words = i.split('_')
          const text = words.map((word) => {
            return word[0].toUpperCase() + word.substring(1)
          }).join(' ')
          optgroup.appendChild(new Option(text, i, selected, selected))
          if (selected) {
            const style = font.toLowerCase().split(' ').join('-')
            switch (style) {
              case 'material-icons':
                element.nextElementSibling.className = style
                element.nextElementSibling.textContent = i
                break;

              default:
                element.nextElementSibling.className = "icon-" + i
                break;
            }
          }
        }
      }
      element.append(optgroup)
    }

    // Apply better Selector styling with jQuery UI (available in Redmine)
    $(element)
      .selectmenu({
        change: function(event: any, data: any) {
          const style = data.item.optgroup.toLowerCase().split(' ').join('-')
          switch (style) {
            case 'material-icons':
              document.querySelector(`#icon_${element.id}`).className = style
              document.querySelector(`#icon_${element.id}`).textContent = data.item.value
              break;

            default:
              document.querySelector(`#icon_${element.id}`).className = 'icon-' + data.item.value
              break;
          }
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
