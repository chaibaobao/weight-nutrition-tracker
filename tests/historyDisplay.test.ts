import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import { calculateWeightTrendDomain, parseWeightTrendMode } from '../src/utils/history';

const points = [
  { weight: 65, average: 70 },
  { weight: 90, average: 71 },
];

describe('体重趋势显示模式', () => {
  it('缺失或损坏的偏好回退为两者', () => {
    expect(parseWeightTrendMode(null)).toBe('both');
    expect(parseWeightTrendMode('unknown')).toBe('both');
  });

  it('实际体重模式的纵轴不受隐藏平均值影响', () => {
    expect(calculateWeightTrendDomain(points, 'actual')).toEqual([61.25, 93.75]);
  });

  it('15日平均模式的纵轴不受隐藏实际体重影响', () => {
    expect(calculateWeightTrendDomain(points, 'average')).toEqual([69.75, 71.25]);
  });

  it('两者模式包含两组可见数据，空数据返回 null', () => {
    expect(calculateWeightTrendDomain(points, 'both')).toEqual([61.25, 93.75]);
    expect(calculateWeightTrendDomain([], 'both')).toBeNull();
  });
});

describe('移动端输入与水平布局基线', () => {
  it('保留可缩放 viewport，不禁止 pinch zoom', () => {
    expect(indexHtml).toContain('width=device-width, initial-scale=1, viewport-fit=cover');
    expect(indexHtml).not.toMatch(/maximum-scale|user-scalable/i);
  });

});
