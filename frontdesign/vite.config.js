// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  optimizeDeps: {
    include: ['pdfjs-dist/build/pdf.worker.min']
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          pdfjsWorker: ['pdfjs-dist/build/pdf.worker.min']
        }
      }
    }
  },
  assetsInclude: ['**/*.worker.js']
});
