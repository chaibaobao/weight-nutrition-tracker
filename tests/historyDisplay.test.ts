import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import { buildWeightTrendData, calculateWeightTrendDomain, isWeightSeriesVisible, parseWeightTrendMode } from '../src/utils/history';

const points = [
  { weight: 65, average: 70 },
  { weight: 90, average: 71 },
];

describe('体重趋势显示模式', () => {
  it('缺失或损坏的偏好回退为两者', () => {
    expect(parseWeightTrendMode(null)).toBe('both');
    expect(parseWeightTrendMode('unknown')).toBe('both');
  });

  it('筛选只控制系列可见性，不破坏完整数值数据', () => {
    const data = buildWeightTrendData([
      { date: '2026-08-10', weightKg: 70, updatedAt: 1 },
      { date: '2026-08-12', weightKg: 72, updatedAt: 2 },
    ], '2026-08-01', '2026-08-12', 'kg');
    expect(data).toEqual([
      { date: '08/10', fullDate: '2026-08-10', weight: 70, average: 70 },
      { date: '08/12', fullDate: '2026-08-12', weight: 72, average: 71 },
    ]);
    expect(data.every(point => typeof point.weight === 'number' && typeof point.average === 'number')).toBe(true);
    expect(isWeightSeriesVisible('actual', 'actual')).toBe(true);
    expect(isWeightSeriesVisible('actual', 'average')).toBe(false);
    expect(isWeightSeriesVisible('average', 'average')).toBe(true);
    expect(isWeightSeriesVisible('both', 'actual')).toBe(true);
    expect(isWeightSeriesVisible('both', 'average')).toBe(true);
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

  it('所有值相同或只有单点时仍生成可绘制的纵轴范围', () => {
    expect(calculateWeightTrendDomain([{ weight: 70, average: 70 }], 'both')).toEqual([69.5, 70.5]);
    expect(calculateWeightTrendDomain([{ weight: 70, average: null }], 'actual')).toEqual([69.5, 70.5]);
  });
});

describe('移动端输入与水平布局基线', () => {
  it('保留可缩放 viewport，不禁止 pinch zoom', () => {
    expect(indexHtml).toContain('width=device-width, initial-scale=1, viewport-fit=cover');
    expect(indexHtml).not.toMatch(/maximum-scale|user-scalable/i);
  });

});
