// import * as $ from 'jquery';
import FontSymbol from 'ol-ext/style/FontSymbol';

const { glyphs, fonts } = FontSymbol.defs;

/**
 * Processes an HTMLSelectElement by populating optgroups with font icons and applying styling using jQuery UI.
 *
 * @param {HTMLSelectElement} element - The select element to be processed.
 */
export const processElement = (element: HTMLSelectElement): void => {
  const selectedValue = element.value;

  if (element.length === 1 && selectedValue !== '') {
    element.remove(0);
  }

  for (const font in fonts) {
    const optgroup = document.createElement('optgroup');
    optgroup.label = fonts[font].name;

    for (const i in glyphs) {
      if (glyphs[i].font === font) {
        const selected = selectedValue === i;
        const words = i.split('_');
        const text = words.map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');

        optgroup.appendChild(new Option(text, i, selected, selected));

        if (selected) {
          const style = font.toLowerCase().replace(/\s+/g, '-');
          const icon = element.nextElementSibling;
          icon.className = `${style}${style === 'material-icons' ? '' : ' icon-' + i}`;
          icon.textContent = style === 'material-icons' ? i : '';
        }
      }
    }

    element.append(optgroup);
  }

  // Apply better Selector styling with jQuery UI (available in Redmine)
  $(element)
    .selectmenu({
      change: function (event: any, data: any) {
        const style = data.item.optgroup.toLowerCase().replace(/\s+/g, '-');
        const icon = document.querySelector(`#icon_${element.id}`);
        icon.className = `${style}${style === 'material-icons' ? '' : ' icon-' + data.item.value}`;
        icon.textContent = style === 'material-icons' ? data.item.value : '';
      },
    })
    .selectmenu('menuWidget')
    .addClass('select-overflow')
    .addClass('ui-menu-icons customicons');
};
