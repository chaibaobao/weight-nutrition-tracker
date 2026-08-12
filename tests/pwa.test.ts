import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import { PWA_CACHE_GLOBS, PWA_MANIFEST, PWA_NAVIGATION_FALLBACK } from '../src/pwaConfig';

describe('PWA 离线配置', () => {
  it('使用相对 start_url 与 scope，适配 GitHub Pages 子路径', () => {
    expect(PWA_MANIFEST.start_url).toBe('./');
    expect(PWA_MANIFEST.scope).toBe('./');
    expect(PWA_MANIFEST.display).toBe('standalone');
  });

  it('提供安装所需的普通与 maskable 图标', () => {
    const icons = PWA_MANIFEST.icons ?? [];
    expect(icons.some(icon => icon.sizes === '192x192')).toBe(true);
    expect(icons.some(icon => icon.sizes === '512x512')).toBe(true);
    expect(icons.some(icon => (Array.isArray(icon.purpose) ? icon.purpose : String(icon.purpose ?? '').split(/\s+/)).includes('maskable'))).toBe(true);
    expect(icons.every(icon => !/^https?:/i.test(icon.src))).toBe(true);
  });

  it('预缓存完整 App Shell 并为页面导航提供离线入口', () => {
    expect(PWA_CACHE_GLOBS).toContain('**/*.{js,css,html,ico,png,svg,webp,webmanifest}');
    expect(PWA_NAVIGATION_FALLBACK).toBe('index.html');
  });

  it('保留可访问缩放且声明安全区 viewport', () => {
    expect(indexHtml).toContain('viewport-fit=cover');
    expect(indexHtml).not.toMatch(/maximum-scale|user-scalable/i);
  });
});
