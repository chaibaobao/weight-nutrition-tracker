import type { WeightRecord } from '../types';
import { addDays, parseLocalDate, toLocalDateKey } from './date';

export const kgToJin = (kg: number): number => kg * 2;
export const jinToKg = (jin: number): number => jin / 2;

export function calculate15DayAverageWeight(records: WeightRecord[], targetDate: string): number | null {
  const start = addDays(targetDate, -14);
  const values = records.filter(r => r.date >= start && r.date <= targetDate && Number.isFinite(r.weightKg) && r.weightKg > 0).map(r => r.weightKg);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

export function validateWeightKg(value: number): string | null {
  if (!Number.isFinite(value)) return '请输入有效数字';
  if (value <= 0) return '体重必须大于 0';
  if (value < 20 || value > 400) return '请输入 20–400 kg 范围内的体重';
  return null;
}

export function validateWeightDate(date: string, today = toLocalDateKey()): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || toLocalDateKey(parseLocalDate(date)) !== date) return '请选择有效日期';
  if (date > today) return '不能记录未来日期';
  return null;
}

/** A weight recorded on D can only affect 15-day windows ending on D through D + 14. */
export function getAffectedSnapshotDates(changedDate: string, candidateDates: string[]): string[] {
  const endDate = addDays(changedDate, 14);
  return [...new Set([changedDate, ...candidateDates.filter(date => date >= changedDate && date <= endDate)])].sort();
}
