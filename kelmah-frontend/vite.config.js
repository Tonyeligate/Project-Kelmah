import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/styled-engine',
      '@mui/icons-material',
      '@mui/x-date-pickers',
      '@mui/material',
      '@mui/system',
      'react-is'
    ]
  },
  define: {
    'process.env': {
      NODE_ENV: JSON.stringify(process.env.NODE_ENV || 'development'),
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:5000'),
      VITE_MESSAGING_URL: JSON.stringify(process.env.VITE_MESSAGING_URL || 'http://localhost:3003')
    }
  },
  build: {
    // Add production optimizations for Vercel
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-mui': ['@mui/material', '@mui/icons-material'],
          'vendor-utils': ['axios', 'date-fns', 'framer-motion']
        }
      }
    },

    // Optimize build for production
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true
      }
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Source maps for debugging (optional)
    sourcemap: false
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true,
    open: true,
    fs: {
      allow: [
        path.resolve(__dirname),
        path.resolve(__dirname, '..')
      ]
    },
    proxy: {
      // Specific service proxies (more specific paths first)
      '/api/users': {
        target: 'https://kelmah-user-service.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/users/, '/api')
      },
      '/api/jobs': {
        target: 'https://kelmah-auth-service.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/jobs/, '/api/jobs')
      },
      '/api/messages': {
        target: 'https://kelmah-messaging-service.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/messages/, '/api')
      },
      '/api/payments': {
        target: 'https://kelmah-payment-service.onrender.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/payments/, '/api')
      },
      // Default /api proxy (for auth service and fallback)
      '/api': {
        target: 'https://kelmah-auth-service.onrender.com',
        changeOrigin: true
      },
      // WebSocket proxy for real-time messaging
      '/ws': {
        target: process.env.VITE_MESSAGING_URL || 'http://localhost:3003',
        ws: true,
        changeOrigin: true
      }
    }
  },
  resolve: {
    alias: {
      'react-is': path.resolve(__dirname, 'node_modules/react-is')
    },
    dedupe: ['react', 'react-dom', 'react-is', '@emotion/react', '@emotion/styled', '@mui/styled-engine'],
    extensions: ['.js', '.jsx', '.json']
  }
})