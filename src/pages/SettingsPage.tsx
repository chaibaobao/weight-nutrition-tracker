import { ChevronRight, Database, Download, FileJson, Info, Ruler, ShieldCheck, Trash2, Upload, UserRound } from 'lucide-react';
import { useRef, useState } from 'react';
import { Modal } from '../components/Modal';
import { Field } from '../components/Ui';
import { PLAN_LABEL } from '../constants';
import { createBackup, downloadJson, exportCsvFiles, restoreBackup, validateBackup } from '../db/backup';
import { clearAllData, db } from '../db/database';
import type { Profile, Sex, WeightUnit } from '../types';
import { toLocalDateKey } from '../utils/date';

export function SettingsPage({ profile, reload, toast }: { profile: Profile; reload: () => Promise<void>; toast: (text: string) => void }) {
  const [profileOpen, setProfileOpen] = useState(false); const [clearOpen, setClearOpen] = useState(false); const fileRef = useRef<HTMLInputElement>(null);
  const exportBackup = async () => { const backup = await createBackup(); downloadJson(`体重营养记录_${toLocalDateKey()}.json`, backup); toast('备份已在本地生成'); };
  const importBackup = async (file?: File) => { if (!file) return; try { const parsed: unknown = JSON.parse(await file.text()); validateBackup(parsed); if (!confirm('导入备份将替换当前本地数据，是否继续？')) return; await restoreBackup(parsed); await reload(); toast('备份导入成功'); } catch (reason) { alert(`无法导入：${reason instanceof Error ? reason.message : '文件已损坏'}`); } finally { if (fileRef.current) fileRef.current.value = ''; } };
  return <div className="settings-page page-enter"><header className="page-header"><div><p>数据在手，记录更安心</p><h1>我的</h1></div><span className="header-art lavender"><UserRound size={24} /></span></header>
    <SettingsSection title="个人资料" icon={<UserRound size={19} />}><button className="settings-row" onClick={() => setProfileOpen(true)}><div><strong>资料与偏好</strong><span>{profile.sex === 'male' ? '男' : '女'} · {profile.heightCm} cm · 默认 {profile.weightUnit === 'jin' ? '斤' : 'kg'}</span></div><ChevronRight size={19} /></button></SettingsSection>
    <SettingsSection title="计算规则" icon={<Ruler size={19} />}><div className="rules-card"><div><b>{PLAN_LABEL['low-fat']}</b><p>蛋白质 = 15日平均体重 × 1.5g<br />碳水 = 15日平均体重 × 2g<br />脂肪 = 40g</p></div><div><b>{PLAN_LABEL['high-fat']}</b><p>蛋白质 = 15日平均体重 × 1.5g<br />碳水 = 15日平均体重 × 1.5g<br />脂肪 = 50g</p></div><small>当日脂肪 ≤ 40g 使用低脂方案；&gt; 40g 自动切换高脂方案。目标热量只由三大营养素推算。</small></div></SettingsSection>
    <SettingsSection title="数据管理" icon={<Database size={19} />}><div className="settings-actions"><button onClick={() => void exportBackup()}><FileJson size={19} /><div><strong>导出备份</strong><span>生成完整 JSON 文件</span></div><Download size={17} /></button><button onClick={() => fileRef.current?.click()}><Upload size={19} /><div><strong>导入备份</strong><span>校验后替换本地数据</span></div><ChevronRight size={17} /></button><input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={e => void importBackup(e.target.files?.[0])} /><button onClick={() => void exportCsvFiles().then(() => toast('CSV 文件已生成'))}><Database size={19} /><div><strong>导出 CSV</strong><span>体重记录 + 每日营养（含 BOM）</span></div><Download size={17} /></button></div></SettingsSection>
    <section className="data-privacy"><ShieldCheck size={23} /><div><strong>关于数据</strong><p>个人数据保存在当前浏览器设备中，不会上传服务器，也不会自动云同步。换手机前请先导出 JSON 备份。</p></div></section>
    <SettingsSection title="危险操作" icon={<Trash2 size={19} />} danger><button className="danger-row" onClick={() => setClearOpen(true)}><Trash2 size={19} /><div><strong>清空全部数据</strong><span>删除体重、饮食、自定义食品和设置</span></div></button></SettingsSection>
    <footer className="about-footer"><Info size={15} /> 体重与营养记录 · V1 · 数据只属于你</footer>
    {profileOpen && <ProfileEditor profile={profile} onClose={() => setProfileOpen(false)} onSaved={async () => { await reload(); setProfileOpen(false); toast('个人资料已保存'); }} />}
    {clearOpen && <ClearDataModal onClose={() => setClearOpen(false)} onCleared={async () => { await reload(); setClearOpen(false); }} />}
  </div>;
}

function SettingsSection({ title, icon, children, danger = false }: { title: string; icon: React.ReactNode; children: React.ReactNode; danger?: boolean }) { return <section className={`settings-section ${danger ? 'danger' : ''}`}><h2>{icon}{title}</h2>{children}</section>; }

function ProfileEditor({ profile, onClose, onSaved }: { profile: Profile; onClose: () => void; onSaved: () => Promise<void> }) {
  const [sex, setSex] = useState<Sex>(profile.sex); const [birthDate, setBirthDate] = useState(profile.birthDate); const [height, setHeight] = useState(String(profile.heightCm)); const [unit, setUnit] = useState<WeightUnit>(profile.weightUnit); const [error, setError] = useState('');
  const save = async () => { const h = Number(height); if (!birthDate || !Number.isFinite(h) || h < 100 || h > 250) { setError('请检查出生日期和身高'); return; } await db.profiles.put({ ...profile, sex, birthDate, heightCm: h, weightUnit: unit }); await onSaved(); };
  return <Modal title="资料与偏好" onClose={onClose}><Field label="生理性别"><div className="segmented"><button className={sex === 'male' ? 'selected' : ''} onClick={() => setSex('male')}>男</button><button className={sex === 'female' ? 'selected' : ''} onClick={() => setSex('female')}>女</button></div></Field><Field label="出生日期"><input type="date" max={toLocalDateKey()} value={birthDate} onChange={e => setBirthDate(e.target.value)} /></Field><Field label="身高"><div className="input-with-unit"><input inputMode="decimal" value={height} onChange={e => setHeight(e.target.value)} /><span>cm</span></div></Field><Field label="默认体重单位"><div className="segmented"><button className={unit === 'kg' ? 'selected' : ''} onClick={() => setUnit('kg')}>kg</button><button className={unit === 'jin' ? 'selected' : ''} onClick={() => setUnit('jin')}>斤</button></div></Field>{error && <p className="form-error">{error}</p>}<button className="primary-button full" onClick={() => void save()}>保存修改</button></Modal>;
}

function ClearDataModal({ onClose, onCleared }: { onClose: () => void; onCleared: () => Promise<void> }) { const [step, setStep] = useState(1); const [text, setText] = useState(''); return <Modal title="清空全部数据" onClose={onClose}><div className="clear-modal"><span className="danger-icon"><Trash2 size={28} /></span>{step === 1 ? <><h3>此操作将删除所有体重、饮食、自定义食品和个人设置。</h3><p>删除后无法恢复。建议先导出备份。</p><div className="button-row"><button className="ghost-button" onClick={onClose}>取消</button><button className="danger-button" onClick={() => setStep(2)}>我已了解，继续</button></div></> : <><h3>请输入“确认清空”</h3><p>这是最后一次确认。</p><input autoFocus value={text} onChange={e => setText(e.target.value)} placeholder="确认清空" /><div className="button-row"><button className="ghost-button" onClick={onClose}>取消</button><button className="danger-button" disabled={text !== '确认清空'} onClick={() => void clearAllData().then(onCleared)}>永久清空</button></div></>}</div></Modal>; }
