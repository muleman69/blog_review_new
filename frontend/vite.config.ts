/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';

  return {
    plugins: [react()],
    base: isProd ? '/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProd,
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
          target: isProd ? 'https://buildableblog.pro' : 'http://localhost:3001',
          changeOrigin: true,
          secure: isProd
        }
      }
    },
    optimizeDeps: {
      include: ['@monaco-editor/react'],
    },
    define: {
      'process.env.VITE_API_URL': JSON.stringify(isProd ? 'https://buildableblog.pro/api' : 'http://localhost:3001/api')
    }
  };
}); 