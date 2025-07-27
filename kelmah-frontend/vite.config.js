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
  },
  build: {
    outDir: 'build',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@mui')) {
              return 'vendor_mui';
            } else if (id.includes('react')) {
              return 'vendor_react';
            }
            return 'vendor'; // all other vendors
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'use-sync-external-store/shim'],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/tests/setup.js',
  },
});
