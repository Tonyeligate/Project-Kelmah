import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';
import path from 'path';

// https://vitejs.dev/config/
// Enable bundle analyzer locally only (avoid opening browser on CI/Vercel)
const ENABLE_ANALYZER = Boolean(process.env.ANALYZE);
const IS_CI = Boolean(process.env.CI || process.env.VERCEL);

export default defineConfig({
  plugins: [
    react(),
    ENABLE_ANALYZER && visualizer({
      template: 'treemap',
      open: false, // never try to open a browser in CI
      gzipSize: true,
      brotliSize: true,
      filename: 'analyse.html',
    }),
  ].filter(Boolean),
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
        target: process.env.VITE_MESSAGING_SERVICE_URL || 'http://localhost:3003',
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
    sourcemap: false,
    rollupOptions: {
      onwarn(warning, warn) {
        // Suppress "Module level directives cause errors when bundled" warnings
        // and external module warnings during Vercel builds
        if (
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.code === 'UNRESOLVED_IMPORT' ||
          warning.message.includes('external')
        ) {
          return;
        }
        warn(warning);
      },
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Core React - must be separate to avoid circular deps
            if (id.includes('react/') || id.includes('react-dom/')) {
              return 'react-core';
            }
            // React ecosystem
            if (id.includes('react-router') || id.includes('react-redux') || id.includes('react-hook-form')) {
              return 'react-libs';
            }
            // Emotion must be separate from MUI to avoid "Cannot access before initialization"
            if (id.includes('@emotion/')) {
              return 'emotion';
            }
            // MUI packages - split by scope to prevent circular deps
            if (id.includes('@mui/material')) {
              return 'mui-material';
            }
            if (id.includes('@mui/icons-material')) {
              return 'mui-icons';
            }
            if (id.includes('@mui/')) {
              return 'mui-other';
            }
            // Redux
            if (id.includes('redux') || id.includes('@reduxjs')) {
              return 'redux';
            }
            // React Query
            if (id.includes('react-query') || id.includes('@tanstack')) {
              return 'react-query';
            }
            // Socket.io
            if (id.includes('socket.io')) {
              return 'socketio';
            }
            // Everything else
            return 'vendor';
          }
        },
      },
    },
    // 🚨 CRITICAL FIX: Ensure public assets including sw.js are copied
    copyPublicDir: true,
    assetsInclude: ['**/*.js', '**/*.json'],
    chunkSizeWarningLimit: 1000,
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'use-sync-external-store/shim',
      '@reduxjs/toolkit',
      'react-redux',
      '@emotion/react',
      '@emotion/styled',
      '@mui/system',
      '@mui/material',
      '@mui/icons-material'
    ],
    force: true,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.[jt]sx?$/,
    exclude: [],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});
