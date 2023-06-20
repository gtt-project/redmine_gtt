/**
 * Overrides jQuery UI's selectmenu with a custom _renderItem method for rendering the list item.
 */
export const overrideSelectMenu = (): void => {
  $.widget('ui.selectmenu', $.ui.selectmenu, {
    /**
     * Custom function to render each item in the select menu with an accompanying icon.
     *
     * @param {JQuery} ul - The unordered list representing the select menu.
     * @param {any} item - The item to be rendered in the select menu.
     * @return {JQuery} - The list item (li) element with the appended wrapper containing the icon and text.
     */
    _renderItem: function (ul: JQuery, item: any): JQuery {
      const li = $('<li>');
      const wrapper = $('<div>', { text: '' });
      const style = item.optgroup.toLowerCase().replace(/\s+/g, '-');

      const isMaterialIconsStyle = style === 'material-icons';
      const iconClass = `ui-icons ${style}${isMaterialIconsStyle ? '' : ' icon-' + item.value}`;

      const iconConfig = {
        class: iconClass,
        title: item.label,
        text: isMaterialIconsStyle ? item.value : '',
      };

      $('<i>', iconConfig).prependTo(wrapper);

      return li.append(wrapper).appendTo(ul);
    },
  });
};
