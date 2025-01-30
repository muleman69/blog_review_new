/// <reference types="vitest" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router-dom', 
            'react-toastify',
            'web-vitals',
            'workbox-cacheable-response',
            'workbox-core',
            'workbox-expiration',
            'workbox-precaching',
            'workbox-routing',
            'workbox-strategies'
          ],
          editor: ['@monaco-editor/react']
        },
        assetFileNames: 'assets/[name].[hash][extname]',
        chunkFileNames: 'assets/[name].[hash].js',
        entryFileNames: '[name].[hash].js'
      }
    }
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  define: {
    __BASE_URL__: JSON.stringify(process.env.VITE_API_URL || 'http://localhost:3000'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
    'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
    'process.env.VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
  }
}); 