import { db, clearAllData } from './database';
import type { BackupData, DailySnapshot, Food, MealEntry, Profile, WeightRecord } from '../types';
import { SCHEMA_VERSION } from '../constants';
import { calculate15DayAverageWeight, kgToJin } from '../utils/weight';

export async function createBackup(): Promise<BackupData> {
  const [profile, weights, meals, customFoods, favorites, snapshots] = await Promise.all([
    db.profiles.get('profile'), db.weights.toArray(), db.meals.toArray(), db.customFoods.toArray(), db.favorites.toArray(), db.snapshots.toArray(),
  ]);
  return { schemaVersion: SCHEMA_VERSION, exportedAt: new Date().toISOString(), profile: profile ?? null, weights, meals, customFoods, favorites: favorites.map(f => f.foodId), snapshots };
}

function isObject(value: unknown): value is Record<string, unknown> { return typeof value === 'object' && value !== null; }

export function validateBackup(value: unknown): asserts value is BackupData {
  if (!isObject(value)) throw new Error('备份文件不是有效对象');
  if (value.schemaVersion !== SCHEMA_VERSION) throw new Error(`不支持的备份版本：${String(value.schemaVersion)}`);
  for (const key of ['weights','meals','customFoods','favorites','snapshots']) if (!Array.isArray(value[key])) throw new Error(`缺少关键字段：${key}`);
  if (value.profile !== null && (!isObject(value.profile) || value.profile.id !== 'profile')) throw new Error('个人资料格式不正确');
  const validWeights = (value.weights as unknown[]).every((item: unknown) => isObject(item) && typeof item.date === 'string' && typeof item.weightKg === 'number' && item.weightKg > 0);
  if (!validWeights) throw new Error('体重记录包含无效数据');
}

export async function restoreBackup(backup: BackupData): Promise<void> {
  validateBackup(backup);
  await db.transaction('rw', [db.profiles, db.weights, db.meals, db.customFoods, db.favorites, db.recentFoods, db.snapshots], async () => {
    await Promise.all([db.profiles.clear(), db.weights.clear(), db.meals.clear(), db.customFoods.clear(), db.favorites.clear(), db.recentFoods.clear(), db.snapshots.clear()]);
    if (backup.profile) await db.profiles.put(backup.profile as Profile);
    await db.weights.bulkPut(backup.weights as WeightRecord[]);
    await db.meals.bulkPut(backup.meals as MealEntry[]);
    await db.customFoods.bulkPut(backup.customFoods as Food[]);
    await db.favorites.bulkPut(backup.favorites.map(foodId => ({ foodId, createdAt: Date.now() })));
    await db.snapshots.bulkPut(backup.snapshots as DailySnapshot[]);
  });
}

const escapeCsv = (value: unknown): string => `"${String(value ?? '').replaceAll('"', '""')}"`;
const downloadText = (filename: string, text: string, type: string): void => {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export function downloadJson(filename: string, value: unknown): void {
  downloadText(filename, JSON.stringify(value, null, 2), 'application/json;charset=utf-8');
}

export async function exportCsvFiles(): Promise<void> {
  const [weights, snapshots, meals] = await Promise.all([db.weights.orderBy('date').toArray(), db.snapshots.toArray(), db.meals.toArray()]);
  const snapshotMap = new Map(snapshots.map(item => [item.date, item]));
  const weightRows = weights.map(item => {
    const snapshot = snapshotMap.get(item.date);
    return [item.date, item.weightKg, kgToJin(item.weightKg), snapshot?.average15DayKg ?? calculate15DayAverageWeight(weights, item.date) ?? '', snapshot?.bmr ?? ''];
  });
  const weightCsv = '\uFEFF' + [['日期','体重kg','体重斤','15日平均kg','BMR'], ...weightRows].map(row => row.map(escapeCsv).join(',')).join('\r\n');
  downloadText('体重记录.csv', weightCsv, 'text/csv;charset=utf-8');

  const dates = [...new Set([...snapshots.map(s => s.date), ...meals.map(m => m.date)])].sort();
  const nutritionRows = dates.map(date => {
    const snapshot = snapshotMap.get(date); const items = meals.filter(m => m.date === date);
    const sum = (key: 'caloriesSnapshot'|'proteinSnapshot'|'carbsSnapshot'|'fatSnapshot') => items.reduce((total, item) => total + item[key], 0);
    return [date, snapshot?.plan === 'high-fat' ? '高脂方案' : '低脂方案', snapshot?.targetCalories ?? '', sum('caloriesSnapshot'), snapshot?.proteinTarget ?? '', sum('proteinSnapshot'), snapshot?.carbsTarget ?? '', sum('carbsSnapshot'), snapshot?.fatTarget ?? '', sum('fatSnapshot')];
  });
  const nutritionCsv = '\uFEFF' + [['日期','方案','目标热量','实际热量','目标蛋白质','实际蛋白质','目标碳水','实际碳水','目标脂肪','实际脂肪'], ...nutritionRows].map(row => row.map(escapeCsv).join(',')).join('\r\n');
  setTimeout(() => downloadText('每日营养.csv', nutritionCsv, 'text/csv;charset=utf-8'), 250);
}
