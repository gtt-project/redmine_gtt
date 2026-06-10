import type { Application } from '@hotwired/stimulus';

declare global {
  interface Window {
    /**
     * Redmine functions
     */

    /** The Stimulus application started by Redmine core */
    Stimulus: Application;

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
     * Gtt functions
     */

    /**
     * Creates a GttClient instance for the given target.
     * @deprecated Maps attach via the gtt-map Stimulus controller; this shim
     * remains for other gtt-project plugins that bootstrap maps manually.
     * @param {HTMLDivElement} target - The HTMLDivElement for which the GttClient will be created.
     */
    createGttClient(target: HTMLDivElement): void;
  }
}

export {}; // This ensures this file is treated as a module
