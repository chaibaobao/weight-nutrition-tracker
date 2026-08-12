export const roundSmart = (value: number, digits = 1): string => {
  const rounded = Number(value.toFixed(digits));
  return rounded.toLocaleString('zh-CN', { maximumFractionDigits: digits });
};
export const roundKcal = (value: number): string => Math.round(value).toLocaleString('zh-CN');

const weightFormatter = new Intl.NumberFormat('zh-CN', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/** Presentation-only weight formatter. Stored values and calculations keep their original precision. */
export function formatWeight(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const formatted = weightFormatter.format(value);
  return formatted === '-0.0' ? '0.0' : formatted;
}
