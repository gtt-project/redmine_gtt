// Redmine function
interface Window {
  availableFilters: any
  operatorByType: any
  operatorLabels: any
  toggleOperator(filed: any): void
  showModal(id: string, width: string, title?: string): void
  buildFilterRowWithoutDistanceFilter(field: any, operator: any, values: any): void
  buildFilterRow(field: any, operator: any, values: any): void
  replaceIssueFormWith(html: any): void
  replaceIssueFormWithInitMap(html: any): void
}
