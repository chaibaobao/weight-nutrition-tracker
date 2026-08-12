import { ChevronRight, Plus, Search, Star } from 'lucide-react';
import { useMemo, useState } from 'react';
import { Field } from '../components/Ui';
import { Modal } from '../components/Modal';
import { FOOD_CATEGORIES } from '../constants';
import { seedFoods } from '../data/seedFoods';
import { db } from '../db/database';
import type { Food, FoodCategory, FoodUnit } from '../types';
import { kjToKcal } from '../utils/nutrition';
import { roundKcal, roundSmart } from '../utils/format';
import { FoodFlow } from './FoodFlow';
import { toLocalDateKey } from '../utils/date';

export function FoodLibraryPage({ customFoods, favorites, recentFoodIds, reload, toast }: { customFoods: Food[]; favorites: string[]; recentFoodIds: string[]; reload: () => Promise<void>; toast: (text: string) => void }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState<FoodCategory | '全部'>('全部'); const [editor, setEditor] = useState<Food | 'new' | null>(null); const [recordFood, setRecordFood] = useState<Food | null>(null); const [pendingDelete, setPendingDelete] = useState<Food | null>(null);
  const foods = useMemo(() => [...customFoods, ...seedFoods], [customFoods]);
  const filtered = foods.filter(food => (category === '全部' || food.category === category) && `${food.name} ${food.brand ?? ''}`.toLowerCase().includes(query.toLowerCase()));
  const toggleFavorite = async (foodId: string) => { if (favorites.includes(foodId)) await db.favorites.delete(foodId); else await db.favorites.put({ foodId, createdAt: Date.now() }); await reload(); };
  const copyFood = (food: Food) => { setRecordFood(null); setEditor({ ...food, id: '', source: 'user', name: `${food.name} - 我的` }); };
  const editFood = (food: Food) => { setRecordFood(null); setEditor(food); };
  const askToDelete = (food: Food) => { setRecordFood(null); setPendingDelete(food); };
  const remove = async () => { if (!pendingDelete || pendingDelete.source !== 'user') return; await db.customFoods.delete(pendingDelete.id); await db.favorites.delete(pendingDelete.id); setPendingDelete(null); await reload(); toast('我的食品已删除，历史记录保持不变'); };
  return <div className="library-page page-enter">
    <header className="page-header"><div><p>更懂你的一日三餐</p><h1>食物库</h1></div><button className="round-add" onClick={() => setEditor('new')}><Plus size={22} /></button></header>
    <div className="search-box library-search"><Search size={20} /><input placeholder="搜索食物或品牌" value={query} onChange={e => setQuery(e.target.value)} /></div>
    <div className="category-chips"><button className={category === '全部' ? 'active' : ''} onClick={() => setCategory('全部')}>全部</button>{FOOD_CATEGORIES.map(item => <button key={item} className={category === item ? 'active' : ''} onClick={() => setCategory(item)}>{item}</button>)}</div>
    <div className="library-summary"><span>{filtered.length} 种食物</span><button onClick={() => setEditor('new')}><Plus size={16} /> 新建我的食品</button></div>
    <section className="library-list">{filtered.map(food => <article key={food.id} className="library-item"><button className={`star-button ${favorites.includes(food.id) ? 'active' : ''}`} onClick={() => void toggleFavorite(food.id)} aria-label={favorites.includes(food.id) ? '取消常用' : '加入常用'}><Star size={19} fill={favorites.includes(food.id) ? 'currentColor' : 'none'} /></button><button className="library-main" onClick={() => setRecordFood(food)}><div><strong>{food.name}</strong><span>{food.brand ? `${food.brand} · ` : ''}{food.source === 'system' ? '系统食品' : '我的食品'} · {food.category}</span></div><b>{roundKcal(food.caloriesKcal)} <small>kcal/{food.basisAmount}{food.basisUnit}</small></b><ChevronRight className="library-chevron" size={18} /></button></article>)}</section>
    {filtered.length === 0 && <p className="inline-empty">没有找到匹配的食物。</p>}
    {editor && <FoodEditor initial={editor === 'new' ? undefined : editor} onClose={() => setEditor(null)} onSaved={async () => { await reload(); setEditor(null); toast('我的食品已保存'); }} />}
    {recordFood && <FoodFlow date={toLocalDateKey()} customFoods={customFoods} favorites={favorites} recentFoodIds={recentFoodIds} initialFood={recordFood} onCopyFood={copyFood} onEditFood={editFood} onDeleteFood={askToDelete} onClose={() => setRecordFood(null)} onSaved={async () => { await reload(); toast('已添加到今天'); }} />}
    {pendingDelete && <Modal title="删除我的食品" onClose={() => setPendingDelete(null)}><div className="confirm-dialog"><p>确定删除“{pendingDelete.name}”吗？</p><span>历史饮食记录会保留当时的食品快照，不会受影响。</span><div><button className="secondary-button" onClick={() => setPendingDelete(null)}>取消</button><button className="danger-button" onClick={() => void remove()}>确认删除</button></div></div></Modal>}
  </div>;
}

function FoodEditor({ initial, onClose, onSaved }: { initial?: Food; onClose: () => void; onSaved: () => Promise<void> }) {
  const [name, setName] = useState(initial?.name ?? ''); const [brand, setBrand] = useState(initial?.brand ?? ''); const [category, setCategory] = useState<FoodCategory>(initial?.category ?? '其他');
  const [basisMode, setBasisMode] = useState<'100g'|'100ml'|'serving'>(initial?.serving ? 'serving' : initial?.basisUnit === 'ml' ? '100ml' : '100g');
  const [servingAmount, setServingAmount] = useState(initial?.serving ? String(initial.serving.amount) : '30'); const [servingLabel, setServingLabel] = useState(initial?.serving?.label ?? '份');
  const [energyUnit, setEnergyUnit] = useState<'kcal'|'kJ'>('kcal'); const [calories, setCalories] = useState(String(initial?.caloriesKcal ?? '')); const [protein, setProtein] = useState(String(initial?.proteinG ?? '')); const [fat, setFat] = useState(String(initial?.fatG ?? '')); const [carbs, setCarbs] = useState(String(initial?.carbsG ?? '')); const [error, setError] = useState('');
  const save = async () => {
    const values = [Number(calories), Number(protein), Number(fat), Number(carbs)]; const serve = Number(servingAmount);
    if (!name.trim()) { setError('请填写食品名称'); return; } if (values.some(v => !Number.isFinite(v) || v < 0 || v > 100000)) { setError('请检查热量和营养值，不能为负数'); return; } if (basisMode === 'serving' && (!Number.isFinite(serve) || serve <= 0)) { setError('请填写每份对应的克数或毫升数'); return; }
    const unit: FoodUnit = basisMode === '100ml' ? 'ml' : initial?.basisUnit ?? 'g'; const inputKcal = energyUnit === 'kJ' ? kjToKcal(values[0]) : values[0]; const ratio = basisMode === 'serving' ? 100 / serve : 1;
    const food: Food = { id: initial?.id || `user-${crypto.randomUUID()}`, name: name.trim(), brand: brand.trim() || undefined, category, source: 'user', basisAmount: 100, basisUnit: unit, caloriesKcal: inputKcal * ratio, proteinG: values[1] * ratio, fatG: values[2] * ratio, carbsG: values[3] * ratio, ...(basisMode === 'serving' ? { serving: { label: servingLabel.trim() || '份', amount: serve, unit } } : {}), updatedAt: Date.now() };
    await db.customFoods.put(food); await onSaved();
  };
  return <Modal title={initial?.id ? '编辑我的食品' : '新建我的食品'} onClose={onClose} wide><div className="food-editor">
    <Field label="食品名称"><input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="例如：自制鸡肉饭" /></Field><Field label="品牌（可选）"><input value={brand} onChange={e => setBrand(e.target.value)} /></Field>
    <Field label="分类"><select value={category} onChange={e => setCategory(e.target.value as FoodCategory)}>{FOOD_CATEGORIES.map(item => <option key={item}>{item}</option>)}</select></Field>
    <Field label="录入方式"><div className="segmented three"><button className={basisMode === '100g' ? 'selected' : ''} onClick={() => setBasisMode('100g')}>每100g</button><button className={basisMode === '100ml' ? 'selected' : ''} onClick={() => setBasisMode('100ml')}>每100ml</button><button className={basisMode === 'serving' ? 'selected' : ''} onClick={() => setBasisMode('serving')}>每份</button></div></Field>
    {basisMode === 'serving' && <div className="two-fields"><Field label="一份数量"><div className="input-with-unit"><input inputMode="decimal" value={servingAmount} onChange={e => setServingAmount(e.target.value)} /><span>{initial?.basisUnit ?? 'g'}</span></div></Field><Field label="份量名称"><input value={servingLabel} onChange={e => setServingLabel(e.target.value)} placeholder="份 / 片 / 个" /></Field></div>}
    <div className="editor-energy-head"><span>{basisMode === 'serving' ? '每份营养' : `每${basisMode === '100ml' ? '100ml' : '100g'}营养`}</span><div className="mini-toggle"><button className={energyUnit === 'kcal' ? 'active' : ''} onClick={() => setEnergyUnit('kcal')}>kcal</button><button className={energyUnit === 'kJ' ? 'active' : ''} onClick={() => setEnergyUnit('kJ')}>kJ</button></div></div>
    <div className="nutrition-input-grid"><Field label={`热量 ${energyUnit}`}><input inputMode="decimal" value={calories} onChange={e => setCalories(e.target.value)} /></Field><Field label="蛋白质 g"><input inputMode="decimal" value={protein} onChange={e => setProtein(e.target.value)} /></Field><Field label="脂肪 g"><input inputMode="decimal" value={fat} onChange={e => setFat(e.target.value)} /></Field><Field label="碳水 g"><input inputMode="decimal" value={carbs} onChange={e => setCarbs(e.target.value)} /></Field></div>
    {energyUnit === 'kJ' && calories && <p className="conversion-note">约 {roundSmart(kjToKcal(Number(calories)))} kcal</p>}{error && <p className="form-error">{error}</p>}<button className="primary-button full" onClick={() => void save()}>保存我的食品</button>
  </div></Modal>;
}
