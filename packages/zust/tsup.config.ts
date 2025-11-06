import { defineConfig } from 'tsup';

export default defineConfig([
    // ESM build (unminified) - for development and debugging
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        dts: true,
        clean: true,
        sourcemap: true,
        minify: false,
        outDir: 'dist',
        outExtension: () => ({ js: '.dev.js' }),
        // Bundle everything for standalone usage
        noExternal: [/.*/],
    },
    // ESM build (minified) - for production
    {
        entry: ['src/index.ts'],
        format: ['esm'],
        dts: false, // Only generate types once
        clean: false,
        sourcemap: true,
        minify: true,
        outDir: 'dist',
        // Bundle everything for standalone usage
        noExternal: [/.*/],
    },
]);