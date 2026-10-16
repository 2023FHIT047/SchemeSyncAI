import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

export const PwaPrompt = () => {
  const [installEvent, setInstallEvent] = useState(null);
  const [offline, setOffline] = useState(() => !navigator.onLine);
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_prompt_dismissed') === '1'
  );

  useEffect(() => {
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setInstallEvent(e);
    };
    const onInstalled = () => setInstallEvent(null);
    const onOnline = () => setOffline(false);
    const onOffline = () => setOffline(true);

    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const handleInstall = async () => {
    if (!installEvent) return;
    installEvent.prompt();
    const { outcome } = await installEvent.userChoice;
    if (outcome === 'accepted') setInstallEvent(null);
  };

  const handleDismiss = () => {
    localStorage.setItem('pwa_prompt_dismissed', '1');
    setDismissed(true);
  };

  return (
    <>
      {offline && (
        <div style={{
          position: 'fixed', top: '0.75rem', left: '50%', transform: 'translateX(-50%)',
          zIndex: 5000, display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: '#78350f', color: '#fef3c7', padding: '0.5rem 1rem',
          borderRadius: '999px', fontSize: '0.82rem', fontWeight: 600,
          boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
        }}>
          <WifiOff style={{ width: '1rem', height: '1rem' }} />
          You're offline — showing cached schemes
        </div>
      )}

      {installEvent && !dismissed && (
        <div style={{
          position: 'fixed', bottom: '1.5rem', left: '1.5rem', zIndex: 5000,
          background: '#1e3a5f', color: 'white', borderRadius: 'var(--radius-lg, 12px)',
          padding: '1rem 1.1rem', width: '19rem',
          boxShadow: '0 10px 30px rgba(15,23,42,0.35)',
          display: 'flex', gap: '0.75rem', alignItems: 'flex-start',
        }}>
          <img
            src="/icons/icon-192.png"
            alt="GovScheme AI"
            style={{ width: '2.6rem', height: '2.6rem', borderRadius: '0.6rem', flexShrink: 0 }}
          />
          <div style={{ flex: 1 }}>
            <p style={{ margin: 0, fontWeight: 700, fontSize: '0.92rem' }}>Install GovScheme AI</p>
            <p style={{ margin: '0.2rem 0 0.65rem', fontSize: '0.78rem', color: '#cbd5e1', lineHeight: 1.4 }}>
              Add the app to your device — browse schemes even with no internet.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                onClick={handleInstall}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.4rem',
                  background: '#22c55e', color: 'white', border: 'none',
                  borderRadius: '0.5rem', padding: '0.42rem 0.85rem',
                  fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer',
                }}
              >
                <Download style={{ width: '0.95rem', height: '0.95rem' }} />
                Install
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  background: 'transparent', color: '#94a3b8', border: '1px solid #334155',
                  borderRadius: '0.5rem', padding: '0.42rem 0.85rem',
                  fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                }}
              >
                Not now
              </button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="Dismiss"
            style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 0, lineHeight: 0 }}
          >
            <X style={{ width: '1rem', height: '1rem' }} />
          </button>
        </div>
      )}
    </>
  );
};
