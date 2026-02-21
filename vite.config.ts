import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['fonts/**/*'],
      manifest: {
        name: 'Muqri — Teleprompter Imam',
        short_name: 'Muqri',
        description: 'Teleprompter Al-Quran untuk Imam Shalat',
        theme_color: '#0a0a0a',
        background_color: '#0a0a0a',
        display: 'fullscreen',
        orientation: 'portrait',
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,woff2,json}'],
        runtimeCaching: [
          {
            urlPattern: /cdn\.jsdelivr\.net\/npm\/quran-json/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'quran-data-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          tensorflow: ['@tensorflow/tfjs', '@tensorflow-models/pose-detection', '@tensorflow-models/face-landmarks-detection'],
          vendor: ['react', 'react-dom', 'react-router-dom', 'zustand', 'idb'],
        },
      },
    },
  },
});
