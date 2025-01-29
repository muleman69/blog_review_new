/// <reference types="vitest" />
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const isProd = mode === 'production';
  const baseApiUrl = isProd ? 'https://buildableblog.pro' : 'http://localhost:3001';

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
          }
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: baseApiUrl,
          changeOrigin: true,
          secure: isProd,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        }
      }
    },
    optimizeDeps: {
      include: ['@monaco-editor/react'],
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env.VITE_API_URL': JSON.stringify(`${baseApiUrl}/api`),
      'process.env.VITE_BASE_URL': JSON.stringify(baseApiUrl),
      'process.env.BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'process.env.VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
    }
  };
}); 