/**
 * Minimal client for the public Iconify API (https://iconify.design):
 * searches across all open icon sets (MDI, Tabler, Lucide, ...) and fetches
 * icon data in bulk. Used by the tracker icon picker in the plugin settings.
 */

const API_BASE = 'https://api.iconify.design';

export interface IconifyIcon {
  /** Stable identifier, e.g. "mdi:bike". */
  id: string;
  /** Standalone SVG markup composed from the icon data. */
  svg: string;
}

interface IconifyIconData {
  body: string;
  width?: number;
  height?: number;
  left?: number;
  top?: number;
}

interface IconifyJsonResponse {
  prefix: string;
  icons: Record<string, IconifyIconData>;
  width?: number;
  height?: number;
}

/** Searches icons; returns icon ids like "mdi:bike". */
export async function searchIcons(query: string, limit = 48, signal?: AbortSignal): Promise<string[]> {
  const url = `${API_BASE}/search?query=${encodeURIComponent(query)}&limit=${limit}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Iconify search failed: ${response.status}`);
  }
  const data = await response.json();
  return Array.isArray(data.icons) ? data.icons : [];
}

/** Fetches icon data in bulk (one request per icon set prefix). */
export async function fetchIcons(ids: string[], signal?: AbortSignal): Promise<IconifyIcon[]> {
  const byPrefix = new Map<string, string[]>();
  for (const id of ids) {
    const [prefix, name] = id.split(':');
    if (!prefix || !name) continue;
    byPrefix.set(prefix, [...(byPrefix.get(prefix) ?? []), name]);
  }

  const results: IconifyIcon[] = [];
  await Promise.all([...byPrefix.entries()].map(async ([prefix, names]) => {
    const url = `${API_BASE}/${encodeURIComponent(prefix)}.json?icons=${encodeURIComponent(names.join(','))}`;
    const response = await fetch(url, { signal });
    if (!response.ok) {
      return;
    }
    const data: IconifyJsonResponse = await response.json();
    for (const [name, icon] of Object.entries(data.icons ?? {})) {
      results.push({ id: `${prefix}:${name}`, svg: composeSvg(icon, data) });
    }
  }));

  // Keep the search ranking order.
  const order = new Map(ids.map((id, index) => [id, index]));
  return results.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}

function composeSvg(icon: IconifyIconData, set: IconifyJsonResponse): string {
  const width = icon.width ?? set.width ?? 16;
  const height = icon.height ?? set.height ?? 16;
  const left = icon.left ?? 0;
  const top = icon.top ?? 0;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${left} ${top} ${width} ${height}">${icon.body}</svg>`;
}
