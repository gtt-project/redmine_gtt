import 'ol/ol.css';
import 'ol-ext/dist/ol-ext.min.css';
import FontSymbol from 'ol-ext/style/FontSymbol';

export const gtt_setting = (): void => {
  // Override jQuery UI select menu
  $.widget('ui.selectmenu', $.ui.selectmenu, {
    _renderItem: function (ul: JQuery, item: any) {
      const li = $('<li>');
      const wrapper = $('<div>', { text: '' });
      const style = item.optgroup.toLowerCase().split(' ').join('-');

      const iconConfig = {
        class: `ui-icons ${style}${style === 'material-icons' ? '' : ' icon-' + item.value}`,
        title: item.label,
        text: style === 'material-icons' ? item.value : '',
      };

      $('<i>', iconConfig).prependTo(wrapper);

      return li.append(wrapper).appendTo(ul);
    },
  });

  const glyph = FontSymbol.defs.glyphs;
  const trackerElements = document.querySelectorAll("[id^='settings_tracker_']");

  const processElement = (element: HTMLSelectElement) => {
    const selectedValue = element.value;

    if (element.length === 1 && selectedValue !== '') {
      element.remove(0);
    }

    for (const font in FontSymbol.defs.fonts) {
      const optgroup = document.createElement('optgroup');
      optgroup.label = FontSymbol.defs.fonts[font].name;

      for (const i in glyph) {
        if (glyph[i].font === font) {
          const selected = selectedValue === i;
          const words = i.split('_');
          const text = words.map((word) => word[0].toUpperCase() + word.substring(1)).join(' ');

          optgroup.appendChild(new Option(text, i, selected, selected));

          if (selected) {
            const style = font.toLowerCase().split(' ').join('-');
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
          const style = data.item.optgroup.toLowerCase().split(' ').join('-');
          const icon = document.querySelector(`#icon_${element.id}`);
          icon.className = `${style}${style === 'material-icons' ? '' : ' icon-' + data.item.value}`;
          icon.textContent = style === 'material-icons' ? data.item.value : '';
        },
      })
      .selectmenu('menuWidget')
      .addClass('select-overflow')
      .addClass('ui-menu-icons customicons');
  };

  trackerElements.forEach(processElement);
};
