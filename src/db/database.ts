import Dexie, { type EntityTable } from 'dexie';
import type { DailySnapshot, Food, MealEntry, Profile, WeightRecord } from '../types';

class TrackerDatabase extends Dexie {
  profiles!: EntityTable<Profile, 'id'>;
  weights!: EntityTable<WeightRecord, 'date'>;
  meals!: EntityTable<MealEntry, 'id'>;
  customFoods!: EntityTable<Food, 'id'>;
  favorites!: EntityTable<{ foodId: string; createdAt: number }, 'foodId'>;
  recentFoods!: EntityTable<{ foodId: string; usedAt: number }, 'foodId'>;
  snapshots!: EntityTable<DailySnapshot, 'date'>;

  constructor() {
    super('weightNutritionTracker');
    this.version(1).stores({
      profiles: 'id',
      weights: 'date',
      meals: '++id,date,foodId,createdAt',
      customFoods: 'id,name,category,updatedAt',
      favorites: 'foodId,createdAt',
      recentFoods: 'foodId,usedAt',
      snapshots: 'date,updatedAt',
    });
  }
}

export const db = new TrackerDatabase();

export async function clearAllData(): Promise<void> {
  await db.transaction('rw', [db.profiles, db.weights, db.meals, db.customFoods, db.favorites, db.recentFoods, db.snapshots], async () => {
    await Promise.all([db.profiles.clear(), db.weights.clear(), db.meals.clear(), db.customFoods.clear(), db.favorites.clear(), db.recentFoods.clear(), db.snapshots.clear()]);
  });
}

export async function touchRecentFood(foodId: string): Promise<void> {
  await db.recentFoods.put({ foodId, usedAt: Date.now() });
  const all = await db.recentFoods.orderBy('usedAt').reverse().toArray();
  if (all.length > 20) await db.recentFoods.bulkDelete(all.slice(20).map(item => item.foodId));
}
