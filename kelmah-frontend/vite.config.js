import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    visualizer({
      template: 'treemap',
      open: true,
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html',
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
        // VERCEL FIX: Explicit chunk loading order
        chunkFileNames: (chunkInfo) => {
          // Add priority prefixes to control load order
          if (chunkInfo.name === 'react-core') {
            return 'assets/0-react-core-[hash].js';  // Load FIRST
          }
          if (chunkInfo.name === 'utilities') {
            return 'assets/1-utilities-[hash].js';   // Load SECOND  
          }
          if (chunkInfo.name === 'state-management') {
            return 'assets/2-state-management-[hash].js'; // Load THIRD
          }
          if (chunkInfo.name === 'ui-framework') {
            return 'assets/3-ui-framework-[hash].js'; // Load FOURTH
          }
          if (chunkInfo.name === 'ui-libs') {
            return 'assets/4-ui-libs-[hash].js';     // Load FIFTH
          }
          return 'assets/5-[name]-[hash].js';       // Everything else LAST
        },
        manualChunks(id) {
          // VERCEL FIX: Prevent module initialization order issues
          if (id.includes('node_modules')) {
            // React ecosystem - must load FIRST with highest priority
            if (id.includes('react') || 
                id.includes('react-dom') || 
                id.includes('react-router') ||
                id.includes('use-sync-external-store') ||
                id.includes('scheduler')) {
              return 'react-core';
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
            
            // Redux and state management - depends on React
            if (id.includes('redux') || 
                id.includes('@reduxjs') ||
                id.includes('reselect') ||
                id.includes('immer')) {
              return 'state-management';
            }
            
            // Material-UI - depends on React
            if (id.includes('@mui') || 
                id.includes('@emotion') ||
                id.includes('emotion')) {
              return 'ui-framework';
            }
            
            // Notification and UI libraries - depend on React
            if (id.includes('notistack') ||
                id.includes('react-helmet') ||
                id.includes('recharts') ||
                id.includes('react-error-boundary')) {
              return 'ui-libs';
            }
            
            // Everything else - load LAST to prevent accessing React before it's ready
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
