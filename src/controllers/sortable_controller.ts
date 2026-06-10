import { Controller } from '@hotwired/stimulus';

/**
 * Makes the admin map layer list drag-sortable:
 * <tbody data-controller="gtt-sortable">.
 *
 * Wraps Redmine core's jQuery positionedItems helper (the same mechanism
 * core uses for enumerations etc.), which saves the new position via the
 * reorder handle URLs rendered into each row. Replaces an inline <script>.
 */
export default class SortableController extends Controller<HTMLElement> {
  connect(): void {
    const jq = (window as any).$;
    if (typeof jq?.fn?.positionedItems === 'function') {
      jq(this.element).positionedItems();
    }
  }
}
