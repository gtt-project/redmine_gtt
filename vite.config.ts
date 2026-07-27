import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

// Static files nothing in the bundle imports: the SVG sprite is consumed by
// Redmine's sprite_icon helper (plugin: 'redmine_gtt') only, so it is
// emitted explicitly instead of via a dummy import.
const STATIC_ASSETS: Record<string, string> = {
  'images/icons.svg': 'src/styles/images/icons.svg',
};

function emitStaticAssets(): Plugin {
  return {
    name: 'redmine-gtt:emit-static-assets',
    generateBundle() {
      for (const [fileName, source] of Object.entries(STATIC_ASSETS)) {
        this.emitFile({
          type: 'asset',
          fileName,
          source: readFileSync(resolve(__dirname, source)),
        });
      }
    },
  };
}

// Builds the plugin frontend into the layout Redmine's plugin asset pipeline
// mirrors and digests (assets/{javascripts,stylesheets,fonts,images}):
// - a single self-executing main.js (dynamic imports inlined: the digesting
//   pipeline rewrites RAILS_ASSET_URL markers and CSS urls, but not ESM
//   chunk specifiers, so the bundle must not be split)
// - one main.css (loaded via stylesheet_link_tag in the html_head hook)
// - fonts and images under their original names; Redmine adds the digests
export default defineConfig({
  // Relative asset urls in the emitted CSS: Redmine's plugin asset pipeline
  // resolves them against the flattened logical layout and digests them.
  base: './',
  plugins: [emitStaticAssets()],
  build: {
    outDir: 'assets',
    emptyOutDir: false,
    cssCodeSplit: false,
    sourcemap: false,
    // Never inline assets as data URIs: the same files are also addressed at
    // runtime via RAILS_ASSET_URL (e.g. the FontFace loading gate), so they
    // must exist as real files for Redmine to digest and serve.
    assetsInlineLimit: 0,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.ts'),
      output: {
        format: 'iife',
        inlineDynamicImports: true,
        entryFileNames: 'javascripts/main.js',
        assetFileNames: (assetInfo) => {
          const name = assetInfo.names?.[0] ?? '';
          if (name.endsWith('.css')) {
            return 'stylesheets/main.css';
          }
          if (/\.(woff2?|ttf|eot|otf)$/.test(name)) {
            return 'fonts/[name][extname]';
          }
          if (/\.(svg|png|jpe?g|gif)$/.test(name)) {
            return 'images/[name][extname]';
          }
          return '[name][extname]';
        },
      },
    },
  },
});
