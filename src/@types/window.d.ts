declare global {
  interface Window {
    /**
     * Redmine functions
     */

    /** An object containing available filters */
    availableFilters: any;

    /** An object containing operators by type */
    operatorByType: any;

    /** An object containing operator labels */
    operatorLabels: any;

    /**
     * Toggles the operator for a given field.
     * @param {any} field - The field for which the operator will be toggled.
     */
    toggleOperator(field: any): void;

    /**
     * Shows a modal with the given ID, width, and optional title.
     * @param {string} id - The ID of the modal to be shown.
     * @param {string} width - The width of the modal.
     * @param {string} [title] - The optional title of the modal.
     */
    showModal(id: string, width: string, title?: string): void;

    /**
     * Builds a filter row without distance filter.
     * @param {any} field - The field for the filter row.
     * @param {any} operator - The operator for the filter row.
     * @param {any} values - The values for the filter row.
     */
    buildFilterRowWithoutDistanceFilter(
      field: any,
      operator: any,
      values: any
    ): void;

    /**
     * Builds a filter row.
     * @param {any} field - The field for the filter row.
     * @param {any} operator - The operator for the filter row.
     * @param {any} values - The values for the filter row.
     */
    buildFilterRow(field: any, operator: any, values: any): void;

    /**
     * Replaces the issue form with the given HTML.
     * @param {any} html - The HTML to replace the issue form with.
     */
    replaceIssueFormWith(html: any): void;

    /**
     * Replaces the issue form with the given HTML and initializes the map.
     * @param {any} html - The HTML to replace the issue form with.
     */
    replaceIssueFormWithInitMap(html: any): void;

    /**
     * Gtt functions
     */

    /**
     * Creates a GttClient instance for the given target.
     * @param {HTMLDivElement} target - The HTMLDivElement for which the GttClient will be created.
     */
    createGttClient(target: HTMLDivElement): void;

    /** A function to handle GTT settings */
    gtt_setting(): void;
  }
}

export {}; // This ensures this file is treated as a module
