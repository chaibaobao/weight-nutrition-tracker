import { CookingPot, CheckCircle2 } from 'lucide-react';
import type { ReactNode } from 'react';
import { roundSmart } from '../utils/format';

export function MacroProgress({ label, actual, target, tone }: { label: string; actual: number; target: number; tone: 'protein'|'carbs'|'fat' }) {
  const percent = target > 0 ? Math.min(100, (actual / target) * 100) : 0;
  return <div className={`macro-row ${tone}`}><div><span>{label}</span><strong>{roundSmart(actual)} / {roundSmart(target)}g</strong></div><div className="progress-track"><i style={{ width: `${percent}%` }} /></div></div>;
}

export function EmptyState({ title, text, action }: { title: string; text: string; action?: ReactNode }) {
  return <div className="empty-state"><span className="empty-icon"><CookingPot size={28} /></span><strong>{title}</strong><p>{text}</p>{action}</div>;
}

export function Toast({ children }: { children: ReactNode }) { return <div className="toast"><CheckCircle2 size={18} />{children}</div>; }

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
