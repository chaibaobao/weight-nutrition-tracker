import { describe, expect, it } from 'vitest';
import indexHtml from '../index.html?raw';
import historyPageSource from '../src/pages/HistoryPage.tsx?raw';
import { buildWeightTrendData, calculateWeightTrendDomain, getWeightDisplayPair, isWeightSeriesVisible, parseWeightTrendMode } from '../src/utils/history';

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
    expect(calculateWeightTrendDomain([{ weight: 140, average: 140 }], 'both', 'jin')).toEqual([139, 141]);
  });

  it('kg 与斤使用同一数据源和等价的局部纵轴范围', () => {
    const records = [
      { date: '2026-08-10', weightKg: 69.8, updatedAt: 1 },
      { date: '2026-08-12', weightKg: 71.2, updatedAt: 2 },
    ];
    const kgData = buildWeightTrendData(records, '2026-08-01', '2026-08-12', 'kg');
    const jinData = buildWeightTrendData(records, '2026-08-01', '2026-08-12', 'jin');
    const kgDomain = calculateWeightTrendDomain(kgData, 'actual', 'kg');
    const jinDomain = calculateWeightTrendDomain(jinData, 'actual', 'jin');
    expect(kgDomain?.[0]).toBeCloseTo(69.55);
    expect(kgDomain?.[1]).toBeCloseTo(71.45);
    expect(jinDomain?.[0]).toBeCloseTo(139.1);
    expect(jinDomain?.[1]).toBeCloseTo(142.9);
    expect(jinData.map(point => point.weight)).toEqual(kgData.map(point => Number(point.weight) * 2));
  });

  it('损坏数值不会进入折线或纵轴计算', () => {
    const data = buildWeightTrendData([
      { date: '2026-08-10', weightKg: Number.NaN, updatedAt: 1 },
      { date: '2026-08-11', weightKg: 0, updatedAt: 2 },
      { date: '2026-08-12', weightKg: 70, updatedAt: 3 },
    ], '2026-08-01', '2026-08-12', 'kg');
    expect(data).toHaveLength(1);
    expect(calculateWeightTrendDomain(data, 'both', 'kg')).toEqual([69.5, 70.5]);
  });
});

describe('历史卡片双单位显示', () => {
  it('默认 kg 时 kg 为主、斤为辅', () => {
    expect(getWeightDisplayPair(70.25, 'kg')).toEqual({
      primary: { value: 70.25, unit: 'kg' },
      secondary: { value: 140.5, unit: '斤' },
    });
  });

  it('默认斤时斤为主、kg 为辅', () => {
    expect(getWeightDisplayPair(70.25, 'jin')).toEqual({
      primary: { value: 140.5, unit: '斤' },
      secondary: { value: 70.25, unit: 'kg' },
    });
  });
});

describe('营养柱状图交互基线', () => {
  it('关闭默认灰色 cursor，并显式设置居中的柱组间距', () => {
    expect(historyPageSource).toContain('cursor={false}');
    expect(historyPageSource).toContain('barCategoryGap="35%"');
    expect(historyPageSource).toContain('barGap={4}');
  });
});

describe('移动端输入与水平布局基线', () => {
  it('保留可缩放 viewport，不禁止 pinch zoom', () => {
    expect(indexHtml).toContain('width=device-width, initial-scale=1, viewport-fit=cover');
    expect(indexHtml).not.toMatch(/maximum-scale|user-scalable/i);
  });

});
