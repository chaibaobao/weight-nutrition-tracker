import { useCallback, useEffect, useState } from 'react';
import { db } from '../db/database';
import type { DailySnapshot, Food, MealEntry, Profile, WeightRecord } from '../types';

export interface AppData {
  profile: Profile | null;
  weights: WeightRecord[];
  meals: MealEntry[];
  customFoods: Food[];
  favorites: string[];
  recentFoodIds: string[];
  snapshots: DailySnapshot[];
}

const empty: AppData = { profile: null, weights: [], meals: [], customFoods: [], favorites: [], recentFoodIds: [], snapshots: [] };

export function useAppData() {
  const [data, setData] = useState<AppData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    try {
      const [profile, weights, meals, customFoods, favorites, recent, snapshots] = await Promise.all([
        db.profiles.get('profile'), db.weights.toArray(), db.meals.toArray(), db.customFoods.toArray(), db.favorites.toArray(), db.recentFoods.orderBy('usedAt').reverse().toArray(), db.snapshots.toArray(),
      ]);
      setData({ profile: profile ?? null, weights, meals, customFoods, favorites: favorites.map(f => f.foodId), recentFoodIds: recent.map(f => f.foodId), snapshots });
      setError(null);
    } catch (reason) {
      console.error(reason);
      setError('本地数据暂时无法读取，请刷新页面重试。');
    } finally { setLoading(false); }
  }, []);
  useEffect(() => { void reload(); }, [reload]);
  return { data, loading, error, reload };
}
