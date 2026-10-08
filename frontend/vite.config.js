import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // In dev, forward /api calls to the Express server so no CORS setup is needed
    proxy: { '/api': { target: 'http://localhost:5000', changeOrigin: true } },
  },
});
