import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],

  build: {
    // Client build output
    outDir: 'dist/client',

    // Remove old files before each build
    emptyOutDir: true,

    // Increase the warning threshold for large JavaScript chunks.
    // This removes the Vite warning for chunks below 1 MB.
    chunkSizeWarningLimit: 1000,
  },

  resolve: {
    alias: {
      '@': projectRoot,
    },
  },

  server: {
    host: '0.0.0.0',
    port: 3000,

    // HMR is disabled when DISABLE_HMR=true
    hmr: process.env.DISABLE_HMR !== 'true',

    // Disable file watching when DISABLE_HMR=true
    watch: process.env.DISABLE_HMR === 'true'
      ? null
      : {},
  },
});
