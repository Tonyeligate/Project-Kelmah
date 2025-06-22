import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      '@emotion/react',
      '@emotion/styled',
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
      VITE_API_URL: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8080')
    }
  },
  build: {
    sourcemap: true
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
    }
  },
  resolve: {
    alias: {
      'react-is': path.resolve(__dirname, 'node_modules/react-is')
    },
    dedupe: ['react', 'react-dom', 'react-is'],
    extensions: ['.js', '.jsx', '.json']
  }
})