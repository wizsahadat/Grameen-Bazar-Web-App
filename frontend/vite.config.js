import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: /api ও /uploads রিকোয়েস্ট Laravel (php artisan serve → 8000) এ প্রক্সি হবে
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://127.0.0.1:8000',
      '/uploads': 'http://127.0.0.1:8000',
    },
  },
});
