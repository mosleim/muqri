import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import path from 'node:path';

/**
 * Vite plugin to fix @mediapipe/face_mesh for production builds.
 *
 * The package uses Google Closure Compiler output with `(function(){var wa=this||self;...}).call(this)`
 * which sets FaceMesh on globalThis/window via P(), but NOT as module.exports.
 * In Vite production builds, Rollup sees an empty module namespace → "FaceMesh is not a constructor".
 *
 * This plugin appends explicit CJS exports so @rollup/plugin-commonjs wraps it correctly.
 */
function mediaPipePlugin(): Plugin {
  return {
    name: 'mediapipe-face-mesh-fix',
    load(id) {
      if (path.basename(id) === 'face_mesh.js' && id.includes('@mediapipe')) {
        let code = readFileSync(id, 'utf-8');
        code += `
exports.FaceMesh = self.FaceMesh;
exports.FACEMESH_LIPS = self.FACEMESH_LIPS;
exports.FACEMESH_LEFT_EYE = self.FACEMESH_LEFT_EYE;
exports.FACEMESH_LEFT_EYEBROW = self.FACEMESH_LEFT_EYEBROW;
exports.FACEMESH_LEFT_IRIS = self.FACEMESH_LEFT_IRIS;
exports.FACEMESH_RIGHT_EYE = self.FACEMESH_RIGHT_EYE;
exports.FACEMESH_RIGHT_EYEBROW = self.FACEMESH_RIGHT_EYEBROW;
exports.FACEMESH_RIGHT_IRIS = self.FACEMESH_RIGHT_IRIS;
exports.FACEMESH_FACE_OVAL = self.FACEMESH_FACE_OVAL;
exports.FACEMESH_CONTOURS = self.FACEMESH_CONTOURS;
exports.FACEMESH_TESSELATION = self.FACEMESH_TESSELATION;
exports.FACE_GEOMETRY = self.FACE_GEOMETRY;
`;
        return { code, map: null };
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    mediaPipePlugin(),
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
        navigateFallback: 'index.html',
        navigateFallbackDenylist: [/^\/api/],
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
    commonjsOptions: {
      transformMixedEsModules: true,
    },
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
