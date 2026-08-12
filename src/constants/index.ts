import type { FoodCategory, MealType } from '../types';

export const SCHEMA_VERSION = 1 as const;
export const ALGORITHM_VERSION = 'v1' as const;
export const FOOD_CATEGORIES: FoodCategory[] = ['主食','肉类','蛋奶','水产','豆制品','蔬菜','水果','坚果','调味 / 油脂','其他'];
export const MEAL_TYPES: MealType[] = ['不分类','早餐','午餐','晚餐','加餐'];
export const PLAN_LABEL = { 'low-fat': '低脂方案', 'high-fat': '高脂方案' } as const;
