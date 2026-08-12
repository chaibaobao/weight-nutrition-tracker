export type Sex = 'male' | 'female';
export type WeightUnit = 'kg' | 'jin';
export type FoodUnit = 'g' | 'ml';
export type FoodCategory = '主食' | '肉类' | '蛋奶' | '水产' | '豆制品' | '蔬菜' | '水果' | '坚果' | '调味 / 油脂' | '其他';
export type MealType = '早餐' | '午餐' | '晚餐' | '加餐' | '不分类';
export type NutritionPlan = 'low-fat' | 'high-fat';

export interface Profile {
  id: 'profile';
  sex: Sex;
  birthDate: string;
  heightCm: number;
  weightUnit: WeightUnit;
  setupComplete: boolean;
}

export interface WeightRecord { date: string; weightKg: number; updatedAt: number }

export interface Serving { label: string; amount: number; unit: FoodUnit }

export interface Food {
  id: string;
  name: string;
  category: FoodCategory;
  source: 'system' | 'user';
  brand?: string;
  basisAmount: number;
  basisUnit: FoodUnit;
  caloriesKcal: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  serving?: Serving;
  updatedAt?: number;
}

export interface MealEntry {
  id?: number;
  date: string;
  foodId: string;
  foodNameSnapshot: string;
  caloriesSnapshot: number;
  proteinSnapshot: number;
  fatSnapshot: number;
  carbsSnapshot: number;
  amount: number;
  unit: FoodUnit;
  mealType: MealType;
  createdAt: number;
}

export interface DailySnapshot {
  date: string;
  average15DayKg: number;
  bmr: number;
  plan: NutritionPlan;
  targetCalories: number;
  proteinTarget: number;
  carbsTarget: number;
  fatTarget: number;
  algorithmVersion: 'v1';
  updatedAt: number;
}

export interface MacroValues { caloriesKcal: number; proteinG: number; carbsG: number; fatG: number }
export interface MacroTargets { proteinG: number; carbsG: number; fatG: number }
export interface BackupData {
  schemaVersion: 1;
  exportedAt: string;
  profile: Profile | null;
  weights: WeightRecord[];
  meals: MealEntry[];
  customFoods: Food[];
  favorites: string[];
  snapshots: DailySnapshot[];
}
