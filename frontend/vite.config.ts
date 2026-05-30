// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const proxyTarget = 'http://localhost:8080';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },

      '/auth': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },

  resolve: {
    alias: {
      '@': '/src',
    },
  },
});