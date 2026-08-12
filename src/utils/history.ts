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
    .filter(record => record.date >= start && record.date <= end)
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
export function calculateWeightTrendDomain(points: WeightTrendPoint[], mode: WeightTrendMode): [number, number] | null {
  const values = points.flatMap(point => {
    const visible: Array<number | null> = [];
    if (isWeightSeriesVisible(mode, 'actual')) visible.push(point.weight);
    if (isWeightSeriesVisible(mode, 'average')) visible.push(point.average);
    return visible.filter((value): value is number => value !== null && Number.isFinite(value));
  });

  if (!values.length) return null;
  const minimum = Math.min(...values);
  const maximum = Math.max(...values);
  const padding = minimum === maximum ? 0.5 : Math.max(0.25, (maximum - minimum) * 0.15);
  return [minimum - padding, maximum + padding];
}
