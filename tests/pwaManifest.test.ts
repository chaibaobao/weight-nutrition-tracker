import { describe, expect, it } from 'vitest';
import { PWA_MANIFEST } from '../src/pwaConfig';

describe('PWA 主屏幕图标', () => {
  it('同时声明 192 与 512 的 maskable 图标', () => {
    expect(PWA_MANIFEST.icons).toEqual(expect.arrayContaining([
      expect.objectContaining({ src: 'maskable-icon-192x192.png', sizes: '192x192', purpose: 'any maskable' }),
      expect.objectContaining({ src: 'maskable-icon-512x512.png', sizes: '512x512', purpose: 'any maskable' }),
    ]));
  });
});
