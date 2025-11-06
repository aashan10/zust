import { defineConfig } from 'tsup';

export default defineConfig([
  // Main package builds (ESM, CJS)
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    sourcemap: true,
    minify: false,
    splitting: false,
    outDir: 'dist',
    external: [],
    esbuildOptions(options) {
      options.banner = {
        js: '"use client";',
      };
    },
  },
  // CDN builds (UMD, minified)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Zust',
    outDir: 'dist',
    outExtension: () => ({ js: '.umd.js' }),
    minify: false,
    sourcemap: true,
    noExternal: [/.*/],
    esbuildOptions(options) {
      options.footer = {
        js: `
// Auto-start Zust when loaded via CDN
if (typeof window !== 'undefined' && window.Zust && window.Zust.default) {
  window.zust = window.Zust.default;
  // Auto-start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.zust.start());
  } else {
    window.zust.start();
  }
}`,
      };
    },
  },
  // CDN build (minified)
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'Zust',
    outDir: 'dist',
    outExtension: () => ({ js: '.umd.min.js' }),
    minify: true,
    sourcemap: true,
    noExternal: [/.*/],
    esbuildOptions(options) {
      options.footer = {
        js: `
// Auto-start Zust when loaded via CDN
if (typeof window !== 'undefined' && window.Zust && window.Zust.default) {
  window.zust = window.Zust.default;
  // Auto-start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => window.zust.start());
  } else {
    window.zust.start();
  }
}`,
      };
    },
  },
]);