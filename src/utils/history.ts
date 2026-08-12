import type { WeightRecord, WeightUnit } from '../types';
import { addDays } from './date';
import { calculate15DayAverageWeight, kgToJin } from './weight';

export type WeightTrendMode = 'actual' | 'average' | 'both';
export type WeightTrendRange = 7 | 15 | 30 | 'all';

export interface WeightTrendPoint {
  weight: number | null;
  average: number | null;
}

export interface WeightChartPoint extends WeightTrendPoint {
  date: string;
  fullDate: string;
}

export interface WeightDisplayPair {
  primary: { value: number; unit: 'kg' | '斤' };
  secondary: { value: number; unit: 'kg' | '斤' };
}

export const WEIGHT_TREND_MODE_KEY = 'weightNutrition.weightTrendMode';

function selectEvenly<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const indexes = Array.from({ length: count }, (_, index) => Math.round(index * (items.length - 1) / (count - 1)));
  return [...new Set(indexes)].map(index => items[index]);
}

function getDateSpanDays(points: WeightChartPoint[]): number {
  if (points.length < 2) return 0;
  const first = new Date(`${points[0].fullDate}T00:00:00`);
  const last = new Date(`${points[points.length - 1].fullDate}T00:00:00`);
  return Math.round((last.getTime() - first.getTime()) / 86_400_000);
}

/** Chooses readable X-axis dates without removing any chart data or tooltip points. */
export function generateWeightXAxisTicks(points: WeightChartPoint[], range: WeightTrendRange, chartWidth: number): string[] {
  if (!points.length) return [];
  const capacity = chartWidth >= 400 ? 7 : chartWidth >= 350 ? 6 : 5;
  const spanDays = getDateSpanDays(points);
  const target = range === 7 ? Math.min(7, capacity) : range === 15 || range === 30 ? Math.min(6, capacity) : Math.min(spanDays > 365 ? 6 : 7, capacity);

  if (range === 'all' && spanDays > 90) {
    const useQuarter = spanDays > 365;
    const buckets = new Map<string, WeightChartPoint>();
    points.forEach(point => {
      const [year, month] = point.fullDate.split('-').map(Number);
      const key = useQuarter ? `${year}-Q${Math.ceil(month / 3)}` : `${year}-${String(month).padStart(2, '0')}`;
      if (!buckets.has(key)) buckets.set(key, point);
    });
    return selectEvenly([...buckets.values()], target).map(point => point.fullDate);
  }

  return selectEvenly(points, target).map(point => point.fullDate);
}

export function formatWeightXAxisTick(date: string, range: WeightTrendRange, spanDays: number): string {
  const [year, month, day] = date.split('-').map(Number);
  if (range === 'all' && spanDays > 365) return `${String(year).slice(2)}年Q${Math.ceil(month / 3)}`;
  if (range === 'all' && spanDays > 90) return `${month}月`;
  return `${month}/${day}`;
}

export function calculateDateSpanDays(points: WeightChartPoint[]): number {
  return getDateSpanDays(points);
}

export function getRecentHistoryDates(dates: string[], today: string, days = 7): string[] {
  const start = addDays(today, -(days - 1));
  return dates.filter(date => date >= start && date <= today).sort().reverse();
}

export function isWeightSeriesVisible(mode: WeightTrendMode, series: 'actual' | 'average'): boolean {
  return mode === 'both' || mode === series;
}

export function parseWeightTrendMode(value: string | null): WeightTrendMode {
  return value === 'actual' || value === 'average' || value === 'both' ? value : 'both';
}

/** Builds one stable, numeric dataset; display filters only decide which series renders. */
export function buildWeightTrendData(records: WeightRecord[], start: string, end: string, unit: WeightUnit): WeightChartPoint[] {
  const convert = (kg: number) => unit === 'jin' ? kgToJin(kg) : kg;
  return records
    .filter(record => record.date >= start && record.date <= end && Number.isFinite(record.weightKg) && record.weightKg > 0)
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(record => {
      const average = calculate15DayAverageWeight(records, record.date);
      return {
        date: record.date.slice(5).replace('-', '/'),
        fullDate: record.date,
        weight: convert(record.weightKg),
        average: average === null ? null : convert(average),
      };
    });
}

/** Only visible series contribute to the chart domain, so hidden outliers do not flatten the line. */
export function calculateWeightTrendDomain(points: WeightTrendPoint[], mode: WeightTrendMode, unit: WeightUnit = 'kg'): [number, number] | null {
  const values = points.flatMap(point => {
    const visible: Array<number | null> = [];
    if (isWeightSeriesVisible(mode, 'actual')) visible.push(point.weight);
    if (isWeightSeriesVisible(mode, 'average')) visible.push(point.average);
    return visible.filter((value): value is number => value !== null && Number.isFinite(value));
  });

  if (!values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const minimumPadding = unit === 'jin' ? 0.5 : 0.25;
  const padding = minimum === maximum ? minimumPadding * 2 : Math.max(minimumPadding, (maximum - minimum) * 0.15);
  return [minimum - padding, maximum + padding];
}

/** Both display values are derived from the same kg source; only their visual priority changes. */
export function getWeightDisplayPair(weightKg: number, preferredUnit: WeightUnit): WeightDisplayPair {
  const kg = { value: weightKg, unit: 'kg' as const };
  const jin = { value: kgToJin(weightKg), unit: '斤' as const };
  return preferredUnit === 'jin' ? { primary: jin, secondary: kg } : { primary: kg, secondary: jin };
}
