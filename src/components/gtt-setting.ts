import 'ol/ol.css'
import 'ol-ext/dist/ol-ext.min.css'
import FontSymbol from 'ol-ext/style/FontSymbol'

export const gtt_setting = ():void => {
  const glyph = FontSymbol.prototype.defs.glyphs
  for (let font in FontSymbol.prototype.defs.fonts) {
    for (let i in glyph) {
      if (glyph[i].font == font) {
        document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
          element.append(new Option(glyph[i].name, i))
        })
      }
    }
  }
  document.querySelectorAll("[id^='settings_tracker_']").forEach((element: HTMLSelectElement) => {
    element.addEventListener('change', (ev) => {
      const currentTarget = ev.currentTarget as HTMLSelectElement
      const trackerId = currentTarget.id
      document.querySelector(`#icon_${trackerId}`).className = currentTarget.value
    })
  })
}
