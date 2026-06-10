import { Controller } from '@hotwired/stimulus';
import DOMPurify from 'dompurify';

import { searchIcons, fetchIcons, IconifyIcon } from '../components/iconify';

const SEARCH_DEBOUNCE_MS = 300;
const RESULT_LIMIT = 48;

/**
 * Tracker icon picker on the plugin settings page. One instance per tracker
 * row; the picked icon is stored as JSON {id, svg} in a hidden field (the
 * server re-sanitizes on save, see RedmineGtt::TrackerIcon).
 *
 * Two ways in, both producing the same stored format:
 * - search the public Iconify API across all open icon sets
 * - paste raw SVG markup from anywhere
 */
export default class IconPickerController extends Controller<HTMLElement> {
  static targets = ['value', 'preview', 'query', 'results', 'paste'];

  declare readonly valueTarget: HTMLInputElement;
  declare readonly previewTarget: HTMLElement;
  declare readonly queryTarget: HTMLInputElement;
  declare readonly resultsTarget: HTMLElement;
  declare readonly pasteTarget: HTMLTextAreaElement;

  private debounceTimer: number | undefined;
  private abortController: AbortController | undefined;

  connect(): void {
    this.renderPreview();
  }

  disconnect(): void {
    window.clearTimeout(this.debounceTimer);
    this.abortController?.abort();
  }

  search(): void {
    window.clearTimeout(this.debounceTimer);
    const query = this.queryTarget.value.trim();
    if (query.length < 2) {
      this.resultsTarget.replaceChildren();
      return;
    }
    this.debounceTimer = window.setTimeout(() => {
      void this.runSearch(query);
    }, SEARCH_DEBOUNCE_MS);
  }

  // Enter in the search field (wired with :prevent so it does not submit
  // the surrounding settings form): search right away.
  searchNow(): void {
    window.clearTimeout(this.debounceTimer);
    const query = this.queryTarget.value.trim();
    if (query.length >= 2) {
      void this.runSearch(query);
    }
  }

  select(event: Event): void {
    const button = (event.target as HTMLElement).closest('button[data-icon-id]') as HTMLButtonElement | null;
    if (!button) {
      return;
    }
    this.store(button.dataset.iconId, button.innerHTML);
    this.resultsTarget.replaceChildren();
    this.queryTarget.value = '';
  }

  applyPaste(event: Event): void {
    event.preventDefault();
    const svg = this.sanitize(this.pasteTarget.value);
    if (svg) {
      this.store('custom', svg);
      this.pasteTarget.value = '';
    }
  }

  clear(event: Event): void {
    event.preventDefault();
    this.valueTarget.value = '';
    this.renderPreview();
  }

  private async runSearch(query: string): Promise<void> {
    this.abortController?.abort();
    this.abortController = new AbortController();
    const { signal } = this.abortController;
    try {
      const ids = await searchIcons(query, RESULT_LIMIT, signal);
      const icons = await fetchIcons(ids, signal);
      this.renderResults(icons);
    } catch (error) {
      if (!signal.aborted) {
        console.error('[redmine_gtt] icon search failed:', error);
      }
    }
  }

  private renderResults(icons: IconifyIcon[]): void {
    this.resultsTarget.replaceChildren(...icons.flatMap((icon) => {
      const svg = this.sanitize(icon.svg);
      if (!svg) {
        return [];
      }
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gtt-icon-result';
      button.title = icon.id;
      button.dataset.iconId = icon.id;
      button.innerHTML = svg;
      return [button];
    }));
  }

  private store(id: string | undefined, svg: string): void {
    this.valueTarget.value = JSON.stringify({ id: id ?? 'custom', svg });
    this.renderPreview();
  }

  private renderPreview(): void {
    let svg = '';
    let label = '';
    try {
      const data = JSON.parse(this.valueTarget.value);
      svg = this.sanitize(data?.svg ?? '');
      label = typeof data?.id === 'string' ? data.id : '';
    } catch {
      // Empty or legacy glyph-name value: nothing to preview.
    }
    this.previewTarget.innerHTML = svg;
    this.previewTarget.title = label;
    this.previewTarget.classList.toggle('gtt-icon-preview--empty', !svg);
  }

  // Client-side sanitization for immediate DOM injection (previews and
  // result buttons); the server applies its own allowlist on save.
  private sanitize(svg: string): string {
    const clean = DOMPurify.sanitize(svg, { USE_PROFILES: { svg: true } });
    return clean.trimStart().startsWith('<svg') ? clean : '';
  }
}
