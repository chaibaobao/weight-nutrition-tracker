import { ArrowLeft, ChevronRight, Clock3, Search, Star, Tags } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { MEAL_TYPES } from '../constants';
import { seedFoods } from '../data/seedFoods';
import { db, touchRecentFood } from '../db/database';
import { recalculateSnapshot } from '../services/snapshots';
import type { Food, MealEntry, MealType } from '../types';
import { calculateFoodNutritionByAmount } from '../utils/nutrition';
import { roundKcal, roundSmart } from '../utils/format';

interface Props { date: string; customFoods: Food[]; favorites: string[]; recentFoodIds: string[]; editing?: MealEntry | null; onClose: () => void; onSaved: () => Promise<void> | void }

export function FoodFlow({ date, customFoods, favorites, recentFoodIds, editing, onClose, onSaved }: Props) {
  const foods = useMemo(() => [...seedFoods, ...customFoods], [customFoods]);
  const initialFood = editing ? foods.find(f => f.id === editing.foodId) ?? ({ id: editing.foodId, name: editing.foodNameSnapshot, category: '其他', source: 'user', basisAmount: editing.amount, basisUnit: editing.unit, caloriesKcal: editing.caloriesSnapshot, proteinG: editing.proteinSnapshot, fatG: editing.fatSnapshot, carbsG: editing.carbsSnapshot } satisfies Food) : null;
  const [selected, setSelected] = useState<Food | null>(initialFood);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [amount, setAmount] = useState(editing ? String(editing.amount) : '100');
  const [amountMode, setAmountMode] = useState<'basis'|'serving'>('basis');
  const [mealType, setMealType] = useState<MealType>(editing?.mealType ?? '不分类');
  const [error, setError] = useState('');
  const filtered = foods.filter(food => `${food.name} ${food.brand ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()) && (!category || food.category === category));
  const recent = recentFoodIds.map(id => foods.find(f => f.id === id)).filter((f): f is Food => Boolean(f));
  const favoriteFoods = favorites.map(id => foods.find(f => f.id === id)).filter((f): f is Food => Boolean(f));
  const normalizedAmount = selected && amountMode === 'serving' && selected.serving ? Number(amount) * selected.serving.amount : Number(amount);
  const nutrition = selected ? calculateFoodNutritionByAmount(selected, Number.isFinite(normalizedAmount) ? normalizedAmount : 0) : null;

  const save = async () => {
    if (!selected || !nutrition || !Number.isFinite(normalizedAmount) || normalizedAmount <= 0 || normalizedAmount > 10000) { setError('请输入大于 0 且合理的食用量'); return; }
    const entry: MealEntry = { date, foodId: selected.id, foodNameSnapshot: selected.name, caloriesSnapshot: nutrition.caloriesKcal, proteinSnapshot: nutrition.proteinG, fatSnapshot: nutrition.fatG, carbsSnapshot: nutrition.carbsG, amount: normalizedAmount, unit: selected.basisUnit, mealType, createdAt: editing?.createdAt ?? Date.now() };
    if (editing?.id) await db.meals.update(editing.id, entry); else await db.meals.add(entry);
    await touchRecentFood(selected.id); await recalculateSnapshot(date); await onSaved(); onClose();
  };

  return <Modal title={selected ? (editing ? '编辑饮食' : '记录饮食') : '搜索食物'} onClose={onClose} wide>
    {!selected ? <div className="food-search-page">
      <div className="search-box"><Search size={20} /><input autoFocus placeholder="搜索食物或品牌" value={query} onChange={e => setQuery(e.target.value)} /><kbd>{filtered.length}</kbd></div>
      {!query && !category && <>
        {recent.length > 0 && <FoodRail title="最近使用" icon={<Clock3 size={18} />} foods={recent.slice(0, 20)} onSelect={setSelected} />}
        {favoriteFoods.length > 0 && <FoodRail title="我的常用" icon={<Star size={18} />} foods={favoriteFoods} onSelect={setSelected} />}
        <section className="food-section"><h3><Tags size={18} /> 分类</h3><div className="category-grid">{['主食','肉类','蛋奶','水产','豆制品','蔬菜','水果','坚果','调味 / 油脂','其他'].map(name => <button key={name} onClick={() => setCategory(name)}>{name}<ChevronRight size={15} /></button>)}</div></section>
      </>}
      {(query || category) && <section className="search-results"><div className="results-title"><h3>{category ?? '搜索结果'}</h3>{category && <button onClick={() => setCategory(null)}>查看全部</button>}</div>{filtered.slice(0, 60).map(food => <FoodRow key={food.id} food={food} onClick={() => setSelected(food)} />)}{filtered.length === 0 && <p className="inline-empty">没有找到，换个关键词试试。</p>}</section>}
    </div> : <div className="food-detail">
      <button className="text-back" onClick={() => setSelected(null)}><ArrowLeft size={18} /> 返回食物列表</button>
      <div className="food-detail-head"><div><span className={`source-badge ${selected.source}`}>{selected.source === 'system' ? '系统食品' : '我的食品'}</span><h2>{selected.name}</h2>{selected.brand && <p>{selected.brand}</p>}</div><div className="food-kcal"><strong>{roundKcal(selected.caloriesKcal)}</strong><span>kcal / {selected.basisAmount}{selected.basisUnit}</span></div></div>
      <div className="nutrition-facts"><div><span>蛋白质</span><strong>{roundSmart(selected.proteinG)}g</strong></div><div><span>碳水</span><strong>{roundSmart(selected.carbsG)}g</strong></div><div><span>脂肪</span><strong>{roundSmart(selected.fatG)}g</strong></div></div>
      {selected.serving && <div className="segmented compact"><button className={amountMode === 'basis' ? 'selected' : ''} onClick={() => { setAmountMode('basis'); setAmount('100'); }}>{selected.basisUnit}</button><button className={amountMode === 'serving' ? 'selected' : ''} onClick={() => { setAmountMode('serving'); setAmount('1'); }}>{selected.serving.label}</button></div>}
      <label className="amount-field"><span>本次食用量</span><div><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /><b>{amountMode === 'serving' && selected.serving ? selected.serving.label : selected.basisUnit}</b></div>{amountMode === 'serving' && selected.serving && <small>1{selected.serving.label} = {selected.serving.amount}{selected.serving.unit}</small>}</label>
      <label className="field"><span>餐次（可选）</span><select value={mealType} onChange={e => setMealType(e.target.value as MealType)}>{MEAL_TYPES.map(type => <option key={type}>{type}</option>)}</select></label>
      {nutrition && <div className="calculated-card"><p>这次将记录</p><strong>{roundKcal(nutrition.caloriesKcal)} <small>kcal</small></strong><div><span>蛋白质 {roundSmart(nutrition.proteinG)}g</span><span>碳水 {roundSmart(nutrition.carbsG)}g</span><span>脂肪 {roundSmart(nutrition.fatG)}g</span></div></div>}
      {error && <p className="form-error">{error}</p>}
      <button className="primary-button full" onClick={() => void save()}>{editing ? '保存修改' : '添加到今日'}</button>
    </div>}
  </Modal>;
}

function FoodRail({ title, icon, foods, onSelect }: { title: string; icon: React.ReactNode; foods: Food[]; onSelect: (food: Food) => void }) {
  return <section className="food-section"><h3>{icon}{title}</h3><div className="food-rail">{foods.map(food => <button key={food.id} onClick={() => onSelect(food)}><span>{food.name}</span><small>{roundKcal(food.caloriesKcal)} kcal/{food.basisAmount}{food.basisUnit}</small></button>)}</div></section>;
}
function FoodRow({ food, onClick }: { food: Food; onClick: () => void }) { return <button className="food-row" onClick={onClick}><div><strong>{food.name}</strong><span>{food.brand ? `${food.brand} · ` : ''}{food.source === 'system' ? '系统食品' : '我的食品'}</span></div><span>{roundKcal(food.caloriesKcal)} kcal<ChevronRight size={16} /></span></button>; }
