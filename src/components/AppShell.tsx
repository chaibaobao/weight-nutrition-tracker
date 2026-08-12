import { Apple, Home, TrendingUp, UserRound } from 'lucide-react';
import type { ReactNode } from 'react';

export type Tab = 'today' | 'history' | 'foods' | 'settings';
const nav: { id: Tab; label: string; icon: typeof Home }[] = [
  { id: 'today', label: '今日', icon: Home }, { id: 'history', label: '历史', icon: TrendingUp },
  { id: 'foods', label: '食物库', icon: Apple }, { id: 'settings', label: '我的', icon: UserRound },
];

export function AppShell({ tab, onTab, children }: { tab: Tab; onTab: (tab: Tab) => void; children: ReactNode }) {
  return <div className="app-shell">
    <main className="page-wrap">{children}</main>
    <nav className="bottom-nav" aria-label="主导航">
      {nav.map(item => { const Icon = item.icon; return <button key={item.id} className={tab === item.id ? 'active' : ''} onClick={() => onTab(item.id)} aria-current={tab === item.id ? 'page' : undefined}>
        <span className="nav-icon"><Icon size={21} strokeWidth={2.2} /></span><span>{item.label}</span>
      </button>; })}
    </nav>
  </div>;
}
