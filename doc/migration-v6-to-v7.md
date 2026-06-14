# Migrating from GTT 6.x to 7.0

GTT 7.0 is a maintenance-focused major release. The plugin's features are
unchanged for everyday users, but the build pipeline, the frontend
architecture, and a few extension points changed in ways that matter when you
**upgrade an installation** or **build another plugin against GTT**.

This guide lists what changed and the steps to take. If you only install GTT
from a prebuilt release archive and use it through the UI, the short version
is: **run the plugin migrations, then re-pick your tracker icons** (see
[Tracker icons](#tracker-icons)). Everything else is either automatic or only
relevant to custom integrations.

## Requirements

No change to the minimum versions, but the toolchain for building the frontend
is different (see [Build & installation](#build--installation)):

- Redmine >= 6.0.0, Ruby >= 3.3, PostgreSQL >= 15, PostGIS >= 3.4
- Node.js >= 22 (24 LTS recommended) and pnpm via `corepack enable pnpm`

## Build & installation

The frontend moved from **webpack + yarn** to **Vite + pnpm**.

| 6.x | 7.0 |
| --- | --- |
| `yarn install` | `pnpm install` (pnpm is pinned in `package.json`; enable with `corepack enable pnpm`) |
| `yarn webpack` | `pnpm build` |
| `yarn webpack --watch` | `pnpm watch` |

If you install from a tagged [GitHub release](https://github.com/gtt-project/redmine_gtt/releases)
archive, the assets are prebuilt and **no Node toolchain is needed** — unpack
and run the plugin migration as usual.

The build now emits a single minified `assets/javascripts/main.js` plus a
separate `assets/stylesheets/main.css` (loaded via the layout hook). There is
nothing to configure; Redmine's asset pipeline digests them as before.

## Database migration

7.0 adds a nullable `type` column to `gtt_map_layers` (for
[named layer types](#map-layer-configuration)). Run the usual plugin
migration after upgrading:

```sh
bundle exec rake redmine:plugins:migrate
```

Existing layer rows are unaffected — a `NULL` type keeps the previous
"OpenLayers classes" behavior.

## Tracker icons

The plugin **no longer ships the Material Design Icons webfont** (this removed
~2.6 MB from the bundle). Tracker icons are now stored as sanitized inline SVG.

- The bundled default icons continue to work.
- **Tracker icons that were set to an arbitrary MDI glyph fall back to the
  default marker.** Re-pick them in the tracker settings: the icon picker now
  searches the [Iconify](https://iconify.design/) catalog (MDI, Tabler,
  Lucide, …) and also accepts pasted raw SVG. Search terms are in English.

This is the one manual step most upgrades need.

## Map layer configuration

Map layers can now be configured through a **schema-driven form** with named
types — `OpenStreetMap`, `XYZ`, `WMS`, `WMTS`, and `Vector tiles (MVT)` — so
common layers no longer require hand-written OpenLayers JSON.

- **Existing layers keep working unchanged.** A layer with no `type` is treated
  as "Advanced (OpenLayers classes)", which is the previous behavior (raw
  layer/source/format class names + option JSON). That mode is still fully
  available from the type selector.
- New layers can use a named type and fill in a small form instead.

## Frontend integration changes

These only matter if you embed GTT maps or hook into them from your own code
(theme, sibling plugin, custom JavaScript).

- **Maps attach via a Stimulus controller.** A map is now a
  `<div data-controller="gtt-map" ...>` rendered by the plugin; there is no
  per-map inline `<script>` anymore. Maps also re-attach correctly after an
  AJAX form replacement.
- **`window.createGttClient(target)` still exists but is deprecated.** It
  remains as a shim for plugins that bootstrap maps manually; prefer letting
  the `gtt-map` controller attach maps.
- **`window.gtt_setting` was removed.** Read configuration from the map
  element's data attributes instead.
- **No icon font is loaded.** If your theme/CSS relied on the MDI `@font-face`
  being present, it is gone; control and marker glyphs are inline SVG.
- The GeoJSON upload dialog is now a native `<dialog>` (no jQuery UI).

## New extension points

7.0 adds first-class, monkey-patch-free ways to extend GTT.

### Event bus

The client publishes lifecycle and interaction events. Subscribe from a
separate bundle via the bubbling DOM `CustomEvent`s — names are on
`window.GttEvent`:

```js
document.addEventListener(window.GttEvent.MapReady, (e) => {
  const { client, map } = e.detail;
});
```

Events: `gtt:map:ready`, `gtt:layers:ready`, `gtt:geometry:change`,
`gtt:feature:select`. Code that holds the client reference can also use the
typed `client.events.on(...)` API.

### Provider and layer registries

- `registerGeocoderProvider(name, factory)` registers a geocoder provider.
- `registerLayerFactory(type, factory, schema?)` registers a named layer type
  (the optional schema drives the admin form). An unknown type or a throwing
  factory is logged and skipped, so one broken layer no longer breaks the map.

## REST API

The plugin **no longer shadows core's `*.api.rsb` templates**. The geometry
fields are injected into core's rendered response instead, so:

- The response shape is **unchanged** — `geojson` on issues/projects/users,
  plus `rotation` on projects and `distance` on the issues index, exactly as
  before. No client change is required.
- As a side effect, the `users` API again exposes the core fields the old
  shadow copy had dropped, and core's API-key visibility rules are honored.

GeoJSON coordinate precision is now configurable (default 6 decimal places,
~0.11 m in EPSG:4326) via the `geojson_precision` plugin setting, which keeps
API and map payloads small for large geometries.

## Summary checklist

1. Build with `pnpm install && pnpm build` (or install a prebuilt release archive).
2. Run `bundle exec rake redmine:plugins:migrate`.
3. Re-pick any tracker icons that used custom MDI glyphs.
4. (Optional) review map layers — existing ones keep working; new ones can use named types.
5. (Optional) set `geojson_precision`.
6. (Integrations) replace `window.gtt_setting` usage; migrate off the deprecated `window.createGttClient` shim; subscribe to the event bus instead of monkey-patching.
