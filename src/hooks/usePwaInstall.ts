import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const esIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) && !('MSStream' in window);
const esStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true;

/** Android/Chrome: usa beforeinstallprompt. iPhone: muestra instrucciones (Compartir → Agregar a inicio). */
export function usePwaInstall() {
  const [evento, setEvento] = useState<BeforeInstallPromptEvent | null>(null);
  const [instalada, setInstalada] = useState(esStandalone());

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setEvento(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setInstalada(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const instalar = useCallback(async () => {
    if (!evento) return false;
    await evento.prompt();
    const { outcome } = await evento.userChoice;
    setEvento(null);
    return outcome === 'accepted';
  }, [evento]);

  return {
    instalada,
    puedeInstalar: !!evento,
    esIOS: esIOS() && !instalada,
    instalar,
  };
}
