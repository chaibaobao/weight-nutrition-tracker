import { ALGORITHM_VERSION } from '../constants';
import { db } from '../db/database';
import { getAge, parseLocalDate } from '../utils/date';
import { calculateBMR, calculateDailyActuals, calculateMacroTargets, calculateTargetCalories, determineNutritionPlan } from '../utils/nutrition';
import { calculate15DayAverageWeight } from '../utils/weight';
import { addDays } from '../utils/date';

export async function recalculateSnapshot(date: string): Promise<void> {
  const [profile, weights, meals] = await Promise.all([db.profiles.get('profile'), db.weights.toArray(), db.meals.where('date').equals(date).toArray()]);
  if (!profile) return;
  const average = calculate15DayAverageWeight(weights, date);
  if (average === null) { await db.snapshots.delete(date); return; }
  const actual = calculateDailyActuals(meals);
  const plan = determineNutritionPlan(actual.fatG);
  const targets = calculateMacroTargets(average, plan);
  await db.snapshots.put({
    date, average15DayKg: average, bmr: calculateBMR(average, profile.heightCm, getAge(profile.birthDate, parseLocalDate(date)), profile.sex),
    plan, targetCalories: calculateTargetCalories(targets), proteinTarget: targets.proteinG, carbsTarget: targets.carbsG, fatTarget: targets.fatG,
    algorithmVersion: ALGORITHM_VERSION, updatedAt: Date.now(),
  });
}

export async function recalculateAffectedSnapshots(changedDate: string): Promise<void> {
  const dates = new Set<string>([changedDate]);
  const [weights, meals, snapshots] = await Promise.all([db.weights.toArray(), db.meals.toArray(), db.snapshots.toArray()]);
  for (const date of [...weights.map(w => w.date), ...meals.map(m => m.date), ...snapshots.map(s => s.date)]) {
    if (date >= changedDate && date <= addDays(changedDate, 14)) dates.add(date);
  }
  for (const date of [...dates].sort()) await recalculateSnapshot(date);
}
