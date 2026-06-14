import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// The side panel is the only part of the extension that uses a build step.
// `service_worker.js` and `content_script.js` are copied verbatim into dist/
// by scripts/postbuild.mjs so the deterministic automation core stays
// byte-identical to the audited source.
export default defineConfig({
  root: resolve(__dirname, 'src/sidepanel'),
  // Relative asset URLs are required under the chrome-extension:// scheme.
  base: './',
  plugins: [react()],
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/sidepanel/sidepanel.html'),
      output: {
        // Stable, predictable file names (no hashing) keep the unpacked
        // extension easy to inspect and review.
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name][extname]'
      }
    }
  }
});
