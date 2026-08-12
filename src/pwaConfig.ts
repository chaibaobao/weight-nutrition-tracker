import type { ManifestOptions } from 'vite-plugin-pwa';

export const PWA_MANIFEST: Partial<ManifestOptions> = {
  name: '体重与营养记录',
  short_name: '营养记录',
  description: '轻快、私密的体重与饮食记录工具',
  lang: 'zh-CN',
  start_url: './',
  scope: './',
  display: 'standalone',
  orientation: 'portrait-primary',
  background_color: '#faf8f2',
  theme_color: '#6faa84',
  icons: [
    { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'maskable-icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
    { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
  ],
};

export const PWA_CACHE_GLOBS = ['**/*.{js,css,html,ico,png,svg,webp,webmanifest}'];
export const PWA_NAVIGATION_FALLBACK = 'index.html';
