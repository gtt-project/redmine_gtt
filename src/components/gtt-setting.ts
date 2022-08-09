import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import FontSymbol from 'ol-ext/style/FontSymbol'

export const gtt_setting = ():void => {
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
          element.append(new Option(i, i, selected, selected))
          if (selected) {
            element.nextElementSibling.className = "material-icons"
            element.nextElementSibling.textContent = i
          }
        }
      }
    }
  })
  document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
    element.addEventListener('change', (ev) => {
      const currentTarget = ev.currentTarget as HTMLSelectElement
      const trackerId = currentTarget.id
      document.querySelector(`#icon_${trackerId}`).className = "material-icons"
      document.querySelector(`#icon_${trackerId}`).textContent = currentTarget.value
    })
  })
}
