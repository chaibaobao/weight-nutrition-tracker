import { Edit3, Leaf, MoreHorizontal, Plus, Scale, Sparkles, Trash2, Utensils } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Modal } from '../components/Modal';
import { EmptyState, MacroProgress } from '../components/Ui';
import type { AppData } from '../hooks/useAppData';
import { db } from '../db/database';
import { recalculateAffectedSnapshots, recalculateSnapshot } from '../services/snapshots';
import type { MealEntry, WeightRecord } from '../types';
import { formatFriendlyDate, getAge, parseLocalDate, toLocalDateKey } from '../utils/date';
import { calculateBMR, calculateDailyActuals, calculateMacroTargets, calculateRemaining, calculateTargetCalories, determineNutritionPlan } from '../utils/nutrition';
import { calculate15DayAverageWeight, jinToKg, kgToJin, validateWeightDate, validateWeightKg } from '../utils/weight';
import { roundKcal, roundSmart } from '../utils/format';
import { PLAN_LABEL } from '../constants';
import { FoodFlow } from './FoodFlow';

export function TodayPage({ data, reload, toast }: { data: AppData; reload: () => Promise<void>; toast: (text: string) => void }) {
  const today = toLocalDateKey(); const profile = data.profile!;
  const [foodFlow, setFoodFlow] = useState(false); const [editingMeal, setEditingMeal] = useState<MealEntry | null>(null); const [weightOpen, setWeightOpen] = useState(false);
  const meals = data.meals.filter(item => item.date === today).sort((a,b) => a.createdAt - b.createdAt);
  const actual = useMemo(() => calculateDailyActuals(meals), [meals]);
  const average = calculate15DayAverageWeight(data.weights, today); const plan = determineNutritionPlan(actual.fatG);
  const targets = average === null ? null : calculateMacroTargets(average, plan); const targetCalories = targets ? calculateTargetCalories(targets) : null;
  const remaining = targets ? calculateRemaining(actual, targets) : null; const currentWeight = data.weights.find(item => item.date === today);
  const bmr = average === null ? null : calculateBMR(average, profile.heightCm, getAge(profile.birthDate, parseLocalDate(today)), profile.sex);

  const removeMeal = async (entry: MealEntry) => {
    if (!entry.id || !confirm(`删除“${entry.foodNameSnapshot}”这条记录？`)) return;
    await db.meals.delete(entry.id); await recalculateSnapshot(today); await reload(); toast('已删除，今日目标已更新');
  };

  return <div className="today-page page-enter">
    <header className="page-header today-header"><div><p>{formatFriendlyDate(today)}</p><h1>今天，也轻松记一下</h1></div><span className="sun-mark"><Sparkles size={20} /></span></header>
    <section className="weight-card soft-card">
      <div className="card-icon mint"><Scale size={22} /></div><div className="weight-copy"><span>今天的体重</span>{currentWeight ? <strong>{roundSmart(profile.weightUnit === 'jin' ? kgToJin(currentWeight.weightKg) : currentWeight.weightKg, 2)} <small>{profile.weightUnit === 'jin' ? '斤' : 'kg'}</small></strong> : <strong className="muted">还没记录</strong>}<p>{average !== null ? `15日平均 ${roundSmart(profile.weightUnit === 'jin' ? kgToJin(average) : average, 2)} ${profile.weightUnit === 'jin' ? '斤' : 'kg'}` : '记录后生成15日平均'}</p></div>
      <button className="mini-edit" onClick={() => setWeightOpen(true)}><Edit3 size={17} /> {currentWeight ? '编辑' : '记录'}</button>
    </section>

    <section className={`nutrition-hero ${plan}`}>
      <div className="hero-decoration one" /><div className="hero-decoration two" />
      <div className="hero-top"><div><span>今日营养</span><small>根据今日脂肪摄入自动调整</small></div><b>{PLAN_LABEL[plan]}</b></div>
      {targets && targetCalories !== null ? <>
        <div className="kcal-focus"><strong>{roundKcal(actual.caloriesKcal)}</strong><span>kcal</span><p>目标 {roundKcal(targetCalories)} kcal</p></div>
        <div className="macro-list"><MacroProgress label="蛋白质" actual={actual.proteinG} target={targets.proteinG} tone="protein" /><MacroProgress label="碳水" actual={actual.carbsG} target={targets.carbsG} tone="carbs" /><MacroProgress label="脂肪" actual={actual.fatG} target={targets.fatG} tone="fat" /></div>
      </> : <div className="hero-no-weight"><Leaf size={30} /><strong>请先记录体重以生成今日目标</strong><button onClick={() => setWeightOpen(true)}>记录体重</button></div>}
    </section>

    {remaining && targetCalories !== null && <section className="remaining-card soft-card peach-card"><div><span>今日剩余</span><strong>{remaining.caloriesKcal >= 0 ? `${roundKcal(remaining.caloriesKcal)} kcal` : `超出 ${roundKcal(Math.abs(remaining.caloriesKcal))} kcal`}</strong></div><div className="remaining-macros"><span>蛋白质 {remaining.proteinG >= 0 ? `${roundSmart(remaining.proteinG)}g` : `比目标多 ${roundSmart(Math.abs(remaining.proteinG))}g`}</span><span>碳水 {remaining.carbsG >= 0 ? `${roundSmart(remaining.carbsG)}g` : `比目标多 ${roundSmart(Math.abs(remaining.carbsG))}g`}</span><span>脂肪 {remaining.fatG >= 0 ? `${roundSmart(remaining.fatG)}g` : `比目标多 ${roundSmart(Math.abs(remaining.fatG))}g`}</span></div></section>}

    <button className="record-food-button" onClick={() => { setEditingMeal(null); setFoodFlow(true); }}><Plus size={23} />记录饮食</button>
    <section className="today-meals"><div className="section-heading"><div><Utensils size={20} /><h2>今日饮食</h2></div><span>{meals.length} 项</span></div>
      {meals.length === 0 ? <EmptyState title="今天还没有饮食记录" text="从第一餐开始记录吧。" /> : <div className="meal-list">{meals.map(entry => <article className="meal-item" key={entry.id}><div className="meal-dot" /><div><span>{entry.mealType !== '不分类' ? entry.mealType : '饮食'}</span><strong>{entry.foodNameSnapshot} <small>{roundSmart(entry.amount)}{entry.unit}</small></strong><p>蛋白质 {roundSmart(entry.proteinSnapshot)}g · 碳水 {roundSmart(entry.carbsSnapshot)}g · 脂肪 {roundSmart(entry.fatSnapshot)}g</p></div><div className="meal-actions"><b>{roundKcal(entry.caloriesSnapshot)} kcal</b><details><summary aria-label="更多操作"><MoreHorizontal size={20} /></summary><div><button onClick={() => { setEditingMeal(entry); setFoodFlow(true); }}><Edit3 size={15} />编辑</button><button onClick={() => void removeMeal(entry)}><Trash2 size={15} />删除</button></div></details></div></article>)}</div>}
    </section>
    {bmr !== null && <p className="bmr-note">基础代谢参考：{roundKcal(bmr)} kcal · 仅作为参考，不参与每日营养目标计算。</p>}
    {weightOpen && <WeightModal date={today} initialKg={currentWeight?.weightKg} unit={profile.weightUnit} onClose={() => setWeightOpen(false)} onSaved={async () => { await reload(); toast('今天的体重已保存'); }} />}
    {foodFlow && <FoodFlow date={today} customFoods={data.customFoods} favorites={data.favorites} recentFoodIds={data.recentFoodIds} editing={editingMeal} onClose={() => { setFoodFlow(false); setEditingMeal(null); }} onSaved={async () => { await reload(); toast(editingMeal ? '饮食记录已更新' : '已添加到今天'); }} />}
  </div>;
}

interface WeightModalProps {
  date: string;
  initialKg?: number;
  unit: 'kg'|'jin';
  weights?: WeightRecord[];
  allowDateSelection?: boolean;
  title?: string;
  onClose: () => void;
  onSaved: (date: string) => Promise<void>;
}

export function WeightModal({ date, initialKg, unit, weights = [], allowDateSelection = false, title, onClose, onSaved }: WeightModalProps) {
  const displayWeight = (kg: number) => String(unit === 'jin' ? kgToJin(kg) : kg);
  const [selectedDate, setSelectedDate] = useState(date);
  const [value, setValue] = useState(initialKg ? displayWeight(initialKg) : '');
  const [duplicate, setDuplicate] = useState<WeightRecord | null>(null);
  const [confirmedExistingDate, setConfirmedExistingDate] = useState<string | null>(null);
  const [error, setError] = useState('');
  const changeDate = (nextDate: string) => {
    setSelectedDate(nextDate); setError(''); setConfirmedExistingDate(null);
    const existing = weights.find(item => item.date === nextDate);
    if (existing && nextDate !== date) { setDuplicate(existing); setValue(''); }
    else { setDuplicate(null); setValue(nextDate === date && initialKg ? displayWeight(initialKg) : ''); }
  };
  const editExisting = () => { if (!duplicate) return; setValue(displayWeight(duplicate.weightKg)); setConfirmedExistingDate(duplicate.date); setDuplicate(null); };
  const save = async () => {
    const dateValidation = validateWeightDate(selectedDate);
    if (dateValidation) { setError(dateValidation); return; }
    const existing = weights.find(item => item.date === selectedDate);
    if (allowDateSelection && existing && selectedDate !== date && confirmedExistingDate !== selectedDate) { setDuplicate(existing); setError(''); return; }
    const number = Number(value); const kg = unit === 'jin' ? jinToKg(number) : number; const validation = validateWeightKg(kg);
    if (validation) { setError(validation); return; }
    await db.weights.put({ date: selectedDate, weightKg: kg, updatedAt: Date.now() });
    await recalculateAffectedSnapshots(selectedDate); await onSaved(selectedDate); onClose();
  };
  return <Modal title={title ?? `${date === toLocalDateKey() ? '今天' : date}的体重`} onClose={onClose}>
    <div className="weight-form">
      {allowDateSelection && <label className="field"><span>日期</span><input type="date" value={selectedDate} max={toLocalDateKey()} onChange={event => changeDate(event.target.value)} /></label>}
      {duplicate && <div className="duplicate-weight-note"><strong>该日期已有体重记录</strong><span>是否编辑现有记录？不会创建第二条记录。</span><div><button onClick={() => { setDuplicate(null); setSelectedDate(date); setValue(initialKg ? displayWeight(initialKg) : ''); }}>取消</button><button onClick={editExisting}>编辑现有记录</button></div></div>}
      {!duplicate && <label className="amount-field"><span>体重</span><div><input autoFocus={!allowDateSelection} inputMode="decimal" value={value} onChange={event => { setValue(event.target.value); setError(''); }} /><b>{unit === 'jin' ? '斤' : 'kg'}</b></div></label>}
      {error && <p className="form-error">{error}</p>}
      {!duplicate && <button className="primary-button full" onClick={() => void save()}>保存体重</button>}
    </div>
  </Modal>;
}
