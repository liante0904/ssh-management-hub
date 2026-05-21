import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5175,
    host: true,
    proxy: {
      '/admin': 'http://localhost:8003',
      '/api': 'http://localhost:8003',
      '/health': 'http://localhost:8003'
    }
  }
});
