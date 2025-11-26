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
      external: [],
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'mui-vendor';
            }
            if (id.includes('redux')) {
              return 'redux-vendor';
            }
            if (id.includes('react-query')) {
              return 'query-vendor';
            }
            return 'vendor';
          }
        },
      },
    },
    // 🚨 CRITICAL FIX: Ensure public assets including sw.js are copied
    copyPublicDir: true,
    assetsInclude: ['**/*.js', '**/*.json'],
    chunkSizeWarningLimit: 1000,
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
