declare global {
  interface Window {
    // Redmine functions
    availableFilters: any;
    operatorByType: any;
    operatorLabels: any;
    toggleOperator(field: any): void;
    showModal(id: string, width: string, title?: string): void;
    buildFilterRowWithoutDistanceFilter(
      field: any,
      operator: any,
      values: any
    ): void;
    buildFilterRow(field: any, operator: any, values: any): void;
    replaceIssueFormWith(html: any): void;
    replaceIssueFormWithInitMap(html: any): void;

    // Gtt functions
    createGttClient(target: HTMLDivElement): void;
    gtt_setting(): void;
  }
}

export {}; // This ensures this file is treated as a module
