import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      template: 'treemap', // or 'sunburst'
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html', // Output file name
    }),
  ],
  define: {
    'process.env': process.env,
    global: 'globalThis',
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:5000',
        changeOrigin: true,
      },
      '/socket.io': {
        target: process.env.VITE_MESSAGING_URL || 'http://localhost:3003',
        ws: true,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          // VERCEL FIX: Consolidate React to prevent duplicate declarations
          if (id.includes('node_modules')) {
            // React and related packages - keep together to prevent "Y already declared"
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') ||
                id.includes('use-sync-external-store') ||
                id.includes('scheduler')) {
              return 'react-vendor';
            }
            // Material-UI
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            // Redux and state management
            if (id.includes('redux') || 
                id.includes('@reduxjs') ||
                id.includes('reselect')) {
              return 'state-vendor';
            }
            // All other vendors (this prevents React from leaking into main vendor)
            return 'core-vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'use-sync-external-store/shim'],
    force: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});
