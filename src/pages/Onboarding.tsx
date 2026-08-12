import { ArrowLeft, ArrowRight, Leaf, Scale, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { db } from '../db/database';
import type { Profile, Sex, WeightUnit } from '../types';
import { jinToKg } from '../utils/weight';
import { Field } from '../components/Ui';
import { toLocalDateKey } from '../utils/date';
import { recalculateSnapshot } from '../services/snapshots';

export function Onboarding({ onComplete }: { onComplete: () => Promise<void> | void }) {
  const [step, setStep] = useState(1);
  const [sex, setSex] = useState<Sex>('female');
  const [birthDate, setBirthDate] = useState('1995-01-01');
  const [heightCm, setHeightCm] = useState('165');
  const [weightUnit, setWeightUnit] = useState<WeightUnit>('kg');
  const [weight, setWeight] = useState('60');
  const [error, setError] = useState('');

  const save = async () => {
    const height = Number(heightCm); const enteredWeight = Number(weight); const weightKg = weightUnit === 'jin' ? jinToKg(enteredWeight) : enteredWeight;
    if (!birthDate || height < 100 || height > 250) { setError('请填写有效的出生日期和身高（100–250 cm）'); return; }
    if (!Number.isFinite(weightKg) || weightKg < 20 || weightKg > 400) { setError(`请输入有效体重（${weightUnit === 'jin' ? '40–800 斤' : '20–400 kg'}）`); return; }
    const profile: Profile = { id: 'profile', sex, birthDate, heightCm: height, weightUnit, setupComplete: true };
    const today = toLocalDateKey();
    await db.transaction('rw', [db.profiles, db.weights], async () => { await db.profiles.put(profile); await db.weights.put({ date: today, weightKg, updatedAt: Date.now() }); });
    await recalculateSnapshot(today); await onComplete();
  };

  return <main className="onboarding">
    <div className="onboarding-orb orb-one" /><div className="onboarding-orb orb-two" />
    <section className="onboarding-card">
      <div className="step-dots" aria-label={`第 ${step} 步，共 3 步`}>{[1,2,3].map(n => <i key={n} className={n <= step ? 'done' : ''} />)}</div>
      {step === 1 && <div className="welcome-step">
        <div className="welcome-mark"><Leaf size={34} /><Sparkles size={22} /></div>
        <p className="eyebrow">每天一点轻记录</p><h1>体重与营养记录</h1>
        <p>记录每日体重、饮食和营养目标。</p>
        <div className="privacy-note">数据只保存在这台设备的浏览器中</div>
        <button className="primary-button" onClick={() => setStep(2)}>开始设置 <ArrowRight size={19} /></button>
      </div>}
      {step === 2 && <div>
        <p className="eyebrow">第 2 步</p><h1>认识一下你</h1><p className="subcopy">这些信息用于计算基础代谢参考值。</p>
        <Field label="生理性别"><div className="segmented"><button className={sex === 'male' ? 'selected' : ''} onClick={() => setSex('male')}>男</button><button className={sex === 'female' ? 'selected' : ''} onClick={() => setSex('female')}>女</button></div></Field>
        <Field label="出生日期"><input type="date" value={birthDate} max={toLocalDateKey()} onChange={e => setBirthDate(e.target.value)} /></Field>
        <Field label="身高"><div className="input-with-unit"><input inputMode="decimal" value={heightCm} onChange={e => setHeightCm(e.target.value)} /><span>cm</span></div></Field>
        <Field label="默认体重单位"><div className="segmented"><button className={weightUnit === 'kg' ? 'selected' : ''} onClick={() => setWeightUnit('kg')}>kg</button><button className={weightUnit === 'jin' ? 'selected' : ''} onClick={() => setWeightUnit('jin')}>斤</button></div></Field>
        <div className="button-row"><button className="ghost-button" onClick={() => setStep(1)}><ArrowLeft size={18} /> 返回</button><button className="primary-button" onClick={() => { if (!birthDate || Number(heightCm) < 100 || Number(heightCm) > 250) setError('请检查出生日期和身高'); else { setError(''); setStep(3); } }}>下一步 <ArrowRight size={18} /></button></div>
      </div>}
      {step === 3 && <div>
        <div className="weight-illustration"><Scale size={34} /></div><p className="eyebrow">最后一步</p><h1>今天的体重</h1><p className="subcopy">这是生成营养目标的起点，以后随时可以修改。</p>
        <Field label="当前体重"><div className="big-weight-input"><input autoFocus inputMode="decimal" value={weight} onChange={e => setWeight(e.target.value)} /><span>{weightUnit === 'jin' ? '斤' : 'kg'}</span></div></Field>
        {error && <p className="form-error">{error}</p>}
        <div className="button-row"><button className="ghost-button" onClick={() => setStep(2)}><ArrowLeft size={18} /> 返回</button><button className="primary-button" onClick={() => void save()}>保存并开始 <ArrowRight size={18} /></button></div>
      </div>}
      {step === 2 && error && <p className="form-error">{error}</p>}
    </section>
  </main>;
}
