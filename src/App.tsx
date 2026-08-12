import { Component, useEffect, useState, type ErrorInfo, type ReactNode } from 'react';
import { AlertCircle, Leaf } from 'lucide-react';
import { AppShell, type Tab } from './components/AppShell';
import { Toast } from './components/Ui';
import { useAppData } from './hooks/useAppData';
import { Onboarding } from './pages/Onboarding';
import { TodayPage } from './pages/TodayPage';
import { HistoryPage } from './pages/HistoryPage';
import { FoodLibraryPage } from './pages/FoodLibraryPage';
import { SettingsPage } from './pages/SettingsPage';

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  componentDidCatch(error: Error, info: ErrorInfo) { console.error('App error', error, info); }
  render() { return this.state.hasError ? <main className="fatal-state"><AlertCircle size={34} /><h1>页面暂时没有准备好</h1><p>你的本地数据不会丢失。请刷新页面再试一次。</p><button onClick={() => location.reload()}>刷新页面</button></main> : this.props.children; }
}

function TrackerApp() {
  const { data, loading, error, reload } = useAppData(); const [tab, setTab] = useState<Tab>('today'); const [toastText, setToastText] = useState('');
  const toast = (text: string) => setToastText(text);
  useEffect(() => { if (!toastText) return; const id = window.setTimeout(() => setToastText(''), 2300); return () => window.clearTimeout(id); }, [toastText]);
  if (loading) return <main className="loading-screen"><span><Leaf size={30} /></span><h1>体重与营养记录</h1><p>正在打开你的今日记录…</p></main>;
  if (error) return <main className="fatal-state"><AlertCircle size={34} /><h1>本地数据暂时无法读取</h1><p>{error}</p><button onClick={() => void reload()}>再试一次</button></main>;
  if (!data.profile?.setupComplete) return <Onboarding onComplete={reload} />;
  return <AppShell tab={tab} onTab={setTab}>
    {tab === 'today' && <TodayPage data={data} reload={reload} toast={toast} />}
    {tab === 'history' && <HistoryPage data={data} reload={reload} toast={toast} />}
    {tab === 'foods' && <FoodLibraryPage customFoods={data.customFoods} favorites={data.favorites} recentFoodIds={data.recentFoodIds} reload={reload} toast={toast} />}
    {tab === 'settings' && <SettingsPage profile={data.profile} reload={reload} toast={toast} />}
    {toastText && <Toast>{toastText}</Toast>}
  </AppShell>;
}

export default function App() { return <ErrorBoundary><TrackerApp /></ErrorBoundary>; }
