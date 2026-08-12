export const roundSmart = (value: number, digits = 1): string => {
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: digits });
};
export const roundKcal = (value: number): string => Math.round(value).toLocaleString('zh-CN');
