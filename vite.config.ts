import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { PWA_CACHE_GLOBS, PWA_MANIFEST, PWA_NAVIGATION_FALLBACK } from './src/pwaConfig.ts';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      manifestFilename: 'manifest.webmanifest',
      manifest: PWA_MANIFEST,
      workbox: {
        globPatterns: PWA_CACHE_GLOBS,
        globIgnores: [
          'og.png',
          'og.webp',
          'manifest.webmanifest',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'maskable-icon-192x192.png',
          'maskable-icon-512x512.png',
        ],
        navigateFallback: PWA_NAVIGATION_FALLBACK,
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: false,
      },
    }),
  ],
  base: './',
  test: { environment: 'node', include: ['tests/**/*.test.ts'] },
});
