import 'fake-indexeddb/auto';
import { afterAll, beforeEach, describe, expect, it } from 'vitest';
import { clearAllData, db } from '../src/db/database';
import { recalculateAffectedSnapshots } from '../src/services/snapshots';
import { calculateBMR } from '../src/utils/nutrition';
import { getAge, parseLocalDate } from '../src/utils/date';
import { getAffectedSnapshotDates, validateWeightDate } from '../src/utils/weight';

beforeEach(async () => {
  await clearAllData();
});

afterAll(async () => {
  db.close();
});

describe('历史体重日期', () => {
  it('允许档案创建日前的过去日期', () => {
    expect(validateWeightDate('2026-08-01', '2026-08-12')).toBeNull();
  });

  it('禁止未来日期', () => {
    expect(validateWeightDate('2026-08-13', '2026-08-12')).toBe('不能记录未来日期');
  });

  it('日期主键保证同一天只有一条最终记录', async () => {
    await db.weights.put({ date: '2026-08-01', weightKg: 70, updatedAt: 1 });
    await db.weights.put({ date: '2026-08-01', weightKg: 71, updatedAt: 2 });
    expect(await db.weights.count()).toBe(1);
    expect((await db.weights.get('2026-08-01'))?.weightKg).toBe(71);
  });

  it('只重算 D 到 D + 14 的相关日期', () => {
    expect(getAffectedSnapshotDates('2026-08-01', ['2026-07-31', '2026-08-01', '2026-08-10', '2026-08-15', '2026-08-16']))
      .toEqual(['2026-08-01', '2026-08-10', '2026-08-15']);
  });
});

describe('历史补录重算', () => {
  it('更新受影响的15日平均和历史年龄 BMR，同时保留实际饮食快照', async () => {
    await db.profiles.put({ id: 'profile', sex: 'male', birthDate: '1995-09-01', heightCm: 175, weightUnit: 'kg', setupComplete: true });
    await db.weights.put({ date: '2025-08-12', weightKg: 72, updatedAt: 1 });
    const mealId = await db.meals.add({
      date: '2025-08-10', foodId: 'system-rice', foodNameSnapshot: '白米饭（熟）',
      caloriesSnapshot: 260, proteinSnapshot: 5.2, carbsSnapshot: 57, fatSnapshot: 0.6,
      amount: 200, unit: 'g', mealType: '午餐', createdAt: 1,
    });

    // 用户补录的 8 月 1 日体重应影响 8 月 1 日至 15 日内已有历史日期。
    await db.weights.put({ date: '2025-08-01', weightKg: 70, updatedAt: 2 });
    await recalculateAffectedSnapshots('2025-08-01');

    const snapshot = await db.snapshots.get('2025-08-10');
    const historicalAge = getAge('1995-09-01', parseLocalDate('2025-08-10'));
    expect(historicalAge).toBe(29);
    expect(snapshot?.average15DayKg).toBe(70);
    expect(snapshot?.bmr).toBe(calculateBMR(70, 175, historicalAge, 'male'));
    expect(snapshot?.algorithmVersion).toBe('v1');
    expect(await db.meals.get(mealId)).toMatchObject({
      caloriesSnapshot: 260, proteinSnapshot: 5.2, carbsSnapshot: 57, fatSnapshot: 0.6,
    });
  });
});
