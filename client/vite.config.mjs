import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import jsconfigPaths from 'vite-jsconfig-paths';

export default defineConfig({
  plugins: [react(), jsconfigPaths()],
  base: '/',
  server: {
    port: 3000,
    host: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  }
});
