import { useEffect, useRef, useState } from 'react';
import { RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;
const RESTORED_NOTICE_MS = 2400;

export function PwaStatus() {
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [restored, setRestored] = useState(false);
  const [needRefresh, setNeedRefresh] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const updateServiceWorker = useRef<((reloadPage?: boolean) => Promise<void>) | null>(null);

  useEffect(() => {
    let updateTimer: number | undefined;
    let restoredTimer: number | undefined;
    let registration: ServiceWorkerRegistration | undefined;

    const checkForUpdate = () => {
      if (navigator.onLine) void registration?.update();
    };
    const handleOffline = () => {
      window.clearTimeout(restoredTimer);
      setRestored(false);
      setOffline(true);
    };
    const handleOnline = () => {
      setOffline(false);
      setRestored(true);
      checkForUpdate();
      window.clearTimeout(restoredTimer);
      restoredTimer = window.setTimeout(() => setRestored(false), RESTORED_NOTICE_MS);
    };
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') checkForUpdate();
    };

    updateServiceWorker.current = registerSW({
      immediate: true,
      onNeedRefresh: () => {
        setDismissed(false);
        setNeedRefresh(true);
      },
      onRegisteredSW: (_url, currentRegistration) => {
        registration = currentRegistration;
        updateTimer = window.setInterval(checkForUpdate, UPDATE_CHECK_INTERVAL_MS);
      },
      onRegisterError: (error) => console.warn('离线功能暂时无法启用', error),
    });

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(updateTimer);
      window.clearTimeout(restoredTimer);
    };
  }, []);

  const installUpdate = async () => {
    await updateServiceWorker.current?.(true);
  };

  return <>
    {(offline || restored) && <div className={`network-status ${offline ? 'offline' : 'restored'}`} role="status" aria-live="polite">
      {offline ? <WifiOff size={15} /> : <Wifi size={15} />}
      <span>{offline ? '离线使用中' : '网络已恢复'}</span>
    </div>}
    {needRefresh && !dismissed && <aside className="update-prompt" aria-live="polite" aria-label="应用更新">
      <div className="update-prompt-icon"><RefreshCw size={19} /></div>
      <div className="update-prompt-copy">
        <strong>发现新版本</strong>
        <span>更新后即可使用最新功能。</span>
      </div>
      <div className="update-prompt-actions">
        <button className="update-later" onClick={() => setDismissed(true)}>稍后</button>
        <button className="update-now" onClick={() => void installUpdate()}>立即更新</button>
      </div>
    </aside>}
  </>;
}
