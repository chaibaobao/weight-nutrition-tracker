import { describe, expect, it } from 'vitest';
import { getAge } from '../src/utils/date';
import { kgToJin, jinToKg, calculate15DayAverageWeight } from '../src/utils/weight';
import { calculateBMR, calculateDailyActuals, calculateFoodNutritionByAmount, calculateMacroTargets, calculateRemaining, calculateTargetCalories, determineNutritionPlan, kjToKcal } from '../src/utils/nutrition';
import type { Food, MealEntry, WeightRecord } from '../src/types';

describe('体重单位', () => {
  it('70kg = 140斤', () => expect(kgToJin(70)).toBe(140));
  it('140斤 = 70kg', () => expect(jinToKg(140)).toBe(70));
});

describe('15日平均', () => {
  it('只计算实际存在的记录，缺失日期不补0', () => {
    const records: WeightRecord[] = [
      { date:'2026-08-01', weightKg:70, updatedAt:0 },
      { date:'2026-08-08', weightKg:72, updatedAt:0 },
      { date:'2026-08-12', weightKg:71, updatedAt:0 },
      { date:'2026-07-28', weightKg:100, updatedAt:0 },
    ];
    expect(calculate15DayAverageWeight(records,'2026-08-12')).toBe(71);
  });
  it('没有记录返回 null', () => expect(calculate15DayAverageWeight([], '2026-08-12')).toBeNull());
});

describe('营养方案与目标', () => {
  it('70kg 低脂方案准确', () => { const target = calculateMacroTargets(70,'low-fat'); expect(target).toEqual({ proteinG:105, carbsG:140, fatG:40 }); expect(calculateTargetCalories(target)).toBe(1340); });
  it('70kg 高脂方案准确', () => { const target = calculateMacroTargets(70,'high-fat'); expect(target).toEqual({ proteinG:105, carbsG:105, fatG:50 }); expect(calculateTargetCalories(target)).toBe(1290); });
  it('40g 边界仍为低脂', () => expect(determineNutritionPlan(40)).toBe('low-fat'));
  it('40.1g 切换为高脂', () => expect(determineNutritionPlan(40.1)).toBe('high-fat'));
  it('剩余值允许为负数并保持客观结果', () => expect(calculateRemaining({caloriesKcal:1400,proteinG:110,carbsG:100,fatG:43},{proteinG:105,carbsG:105,fatG:50})).toEqual({caloriesKcal:-110,proteinG:-5,carbsG:5,fatG:7}));
});

describe('kJ 与食品换算', () => {
  it('418.4kJ = 100kcal', () => expect(kjToKcal(418.4)).toBeCloseTo(100,10));
  it('100g 食品换算到 180g', () => {
    const food: Food = { id:'x',name:'测试',category:'其他',source:'system',basisAmount:100,basisUnit:'g',caloriesKcal:165,proteinG:31,fatG:3.6,carbsG:0 };
    expect(calculateFoodNutritionByAmount(food,180)).toEqual({ caloriesKcal:297, proteinG:55.800000000000004, carbsG:0, fatG:6.48 });
  });
  it('每日实际摄入汇总', () => {
    const base = { date:'2026-08-12',foodId:'x',foodNameSnapshot:'食品',amount:100,unit:'g' as const,mealType:'不分类' as const,createdAt:0 };
    const entries: MealEntry[] = [{...base,caloriesSnapshot:100,proteinSnapshot:10,carbsSnapshot:5,fatSnapshot:3},{...base,caloriesSnapshot:50,proteinSnapshot:2,carbsSnapshot:7,fatSnapshot:1}];
    expect(calculateDailyActuals(entries)).toEqual({caloriesKcal:150,proteinG:12,carbsG:12,fatG:4});
  });
});

describe('BMR 与年龄', () => {
  it('男性 Mifflin–St Jeor', () => expect(calculateBMR(70,175,30,'male')).toBe(1648.75));
  it('女性 Mifflin–St Jeor', () => expect(calculateBMR(60,165,28,'female')).toBe(1330.25));
  it('生日未到时年龄少一岁', () => expect(getAge('2000-12-20', new Date(2026,7,12))).toBe(25));
});
