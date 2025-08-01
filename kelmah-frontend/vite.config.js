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
      // Auth service routes
      '/api/auth': {
        target: 'https://kelmah-auth-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Auth proxy error:', err);
          });
        },
      },
      // User service routes
      '/api/users': {
        target: 'https://kelmah-user-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('User proxy error:', err);
          });
        },
      },
      // Job service routes
      '/api/jobs': {
        target: 'https://kelmah-job-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
        configure: (proxy, options) => {
          proxy.on('error', (err, req, res) => {
            console.log('Job proxy error:', err);
          });
        },
      },
      // Messaging service routes
      '/api/messages': {
        target: 'https://kelmah-messaging-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
      },
      '/api/conversations': {
        target: 'https://kelmah-messaging-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
      },
      // Payment service routes
      '/api/payments': {
        target: 'https://kelmah-payment-service.onrender.com',
        changeOrigin: true,
        secure: true,
        timeout: 10000,
      },
      // WebSocket for messaging
      '/socket.io': {
        target: 'https://kelmah-messaging-service.onrender.com',
        ws: true,
        changeOrigin: true,
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
        manualChunks: {
          // VERCEL FIX: Simpler, more reliable chunking
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled'],
          'redux-vendor': ['@reduxjs/toolkit', 'react-redux'],
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
