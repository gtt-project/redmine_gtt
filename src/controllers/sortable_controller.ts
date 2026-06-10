import { Controller } from '@hotwired/stimulus';

// Redmine core's drag-reorder jQuery helper (application-legacy.js); typed
// here because @types/jquery cannot know about core's extensions.
declare global {
  interface JQuery {
    positionedItems(options?: unknown): JQuery;
  }
}

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
    // jQuery and the helper come from Redmine core; no-op if absent.
    if (typeof $ === 'undefined' || typeof $.fn.positionedItems !== 'function') {
      return;
    }
    $(this.element).positionedItems();
  }
}
