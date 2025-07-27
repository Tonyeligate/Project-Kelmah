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
          // VERCEL FIX: Prevent module initialization order issues
          if (id.includes('node_modules')) {
            // React ecosystem - must load first
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') ||
                id.includes('use-sync-external-store') ||
                id.includes('scheduler')) {
              return 'react-core';
            }
            
            // Redux and state management - depends on React
            if (id.includes('redux') || 
                id.includes('@reduxjs') ||
                id.includes('reselect') ||
                id.includes('immer')) {
              return 'state-management';
            }
            
            // Material-UI - can load independently
            if (id.includes('@mui') || 
                id.includes('@emotion') ||
                id.includes('emotion')) {
              return 'ui-framework';
            }
            
            // Low-level utilities (these need to load early)
            if (id.includes('lodash') ||
                id.includes('date-fns') ||
                id.includes('dayjs') ||
                id.includes('moment') ||
                id.includes('axios') ||
                id.includes('crypto') ||
                id.includes('buffer')) {
              return 'utilities';
            }
            
            // Notification and UI libraries
            if (id.includes('notistack') ||
                id.includes('react-helmet') ||
                id.includes('recharts') ||
                id.includes('react-error-boundary')) {
              return 'ui-libs';
            }
            
            // Everything else - load last
            return 'vendor';
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'use-sync-external-store/shim',
      '@reduxjs/toolkit',
      'react-redux'
    ],
    force: true,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});
