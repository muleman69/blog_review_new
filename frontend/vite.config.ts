/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const baseUrl = env.VITE_BASE_URL || (isProd ? 'https://buildableblog.pro' : 'http://localhost:3000');
  const apiUrl = env.VITE_API_URL || (isProd ? `${baseUrl}/api` : 'http://localhost:3001/api');

  return {
    plugins: [react()],
    base: '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: true,
      manifest: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            editor: ['@monaco-editor/react'],
          },
          assetFileNames: 'assets/[name]-[hash][extname]',
          chunkFileNames: 'assets/[name]-[hash].js',
          entryFileNames: '[name]-[hash].js'
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    optimizeDeps: {
      include: ['@monaco-editor/react'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_API_URL': JSON.stringify(apiUrl),
      'process.env.VITE_BASE_URL': JSON.stringify(baseUrl),
      'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'process.env.VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
    }
  };
}); 