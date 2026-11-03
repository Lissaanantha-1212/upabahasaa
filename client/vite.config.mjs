import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Menjadikan folder src sebagai akar utama untuk semua impor tanpa tanda ./
      '@': path.resolve(__dirname, 'src'),
      'api': path.resolve(__dirname, 'src/api'),
      'ui-component': path.resolve(__dirname, 'src/ui-component'),
      'contexts': path.resolve(__dirname, 'src/contexts'),
      'hooks': path.resolve(__dirname, 'src/hooks'),
      'routes': path.resolve(__dirname, 'src/routes'),
      'layout': path.resolve(__dirname, 'src/layout'),
      'themes': path.resolve(__dirname, 'src/themes'),
      'utils': path.resolve(__dirname, 'src/utils'),
      'views': path.resolve(__dirname, 'src/views'),
      'menu-items': path.resolve(__dirname, 'src/menu-items'),
      'assets': path.resolve(__dirname, 'src/assets'),
      'store': path.resolve(__dirname, 'src/store'),
      'config': path.resolve(__dirname, 'src/config.js')
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    chunkSizeWarningLimit: 1600
  }
});