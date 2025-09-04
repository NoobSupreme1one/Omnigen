import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom'],
          // UI components and icons
          'ui-vendor': ['lucide-react', 'react-quill'],
          // PDF and file handling
          'pdf-vendor': ['jspdf', 'file-saver', 'jszip'],
          // Canvas and image processing
          'canvas-vendor': ['html2canvas'],
          // Google AI
          'ai-vendor': ['@google/genai'],
        },
      },
    },
  },
});
