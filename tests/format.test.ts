import { describe, expect, it } from 'vitest';
import { formatWeight } from '../src/utils/format';

describe('体重显示格式', () => {
  it.each([
    [70.24, '70.2'],
    [70.25, '70.3'],
    [70.26, '70.3'],
    [140.48, '140.5'],
    [140.55, '140.6'],
    [70, '70.0'],
  ])('%s 四舍五入显示为 %s', (value, expected) => {
    expect(formatWeight(value)).toBe(expected);
  });

  it('异常值不会泄漏为 NaN 或 Infinity', () => {
    expect(formatWeight(Number.NaN)).toBe('—');
    expect(formatWeight(Number.POSITIVE_INFINITY)).toBe('—');
  });

  it('极小负数不会显示为负零', () => {
    expect(formatWeight(-0.01)).toBe('0.0');
  });
});
