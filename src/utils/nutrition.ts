import type { Food, MacroTargets, MacroValues, MealEntry, NutritionPlan, Sex } from '../types';

export function calculateBMR(weightKg: number, heightCm: number, age: number, sex: Sex): number {
  return 10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'male' ? 5 : -161);
}

export function determineNutritionPlan(actualFatG: number): NutritionPlan {
  return actualFatG <= 40 ? 'low-fat' : 'high-fat';
}

export function calculateMacroTargets(weightKg: number, plan: NutritionPlan): MacroTargets {
  return plan === 'low-fat'
    ? { proteinG: weightKg * 1.5, carbsG: weightKg * 2, fatG: 40 }
    : { proteinG: weightKg * 1.5, carbsG: weightKg * 1.5, fatG: 50 };
}

export function calculateTargetCalories(targets: MacroTargets): number {
  return targets.proteinG * 4 + targets.carbsG * 4 + targets.fatG * 9;
}

export function calculateFoodNutritionByAmount(food: Pick<Food, 'basisAmount'|'caloriesKcal'|'proteinG'|'carbsG'|'fatG'>, amount: number): MacroValues {
  const ratio = amount / food.basisAmount;
  return {
    caloriesKcal: food.caloriesKcal * ratio,
    proteinG: food.proteinG * ratio,
    carbsG: food.carbsG * ratio,
    fatG: food.fatG * ratio,
  };
}

export const kjToKcal = (kj: number): number => kj / 4.184;

export function calculateDailyActuals(entries: MealEntry[]): MacroValues {
  return entries.reduce<MacroValues>((sum, item) => ({
    caloriesKcal: sum.caloriesKcal + item.caloriesSnapshot,
    proteinG: sum.proteinG + item.proteinSnapshot,
    carbsG: sum.carbsG + item.carbsSnapshot,
    fatG: sum.fatG + item.fatSnapshot,
  }), { caloriesKcal: 0, proteinG: 0, carbsG: 0, fatG: 0 });
}

export function calculateRemaining(actual: MacroValues, targets: MacroTargets): MacroValues {
  return {
    caloriesKcal: calculateTargetCalories(targets) - actual.caloriesKcal,
    proteinG: targets.proteinG - actual.proteinG,
    carbsG: targets.carbsG - actual.carbsG,
    fatG: targets.fatG - actual.fatG,
  };
}
