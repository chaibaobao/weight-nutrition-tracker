import type { WeightRecord, WeightUnit } from '../types';
import { calculate15DayAverageWeight, kgToJin } from './weight';

export type WeightTrendMode = 'actual' | 'average' | 'both';

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
