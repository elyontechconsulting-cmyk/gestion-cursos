import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui';

/** Registra el Service Worker y avisa cuando hay una nueva versión o la app quedó lista offline. */
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    offlineReady: [offlineReady, setOfflineReady],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, reg) {
      // Buscar actualizaciones cada hora
      if (reg) setInterval(() => void reg.update(), 60 * 60 * 1000);
    },
  });

  if (!needRefresh && !offlineReady) return null;

  return (
    <div className="fixed right-3 top-16 z-50 w-[calc(100%-1.5rem)] max-w-sm animate-fade-in">
      <div className="card flex items-center gap-3 p-3.5 text-sm shadow-xl">
        <RefreshCw className="h-4 w-4 shrink-0 text-brand-600" />
        <p className="flex-1">{needRefresh ? 'Hay una nueva versión disponible.' : 'La aplicación está lista para usarse sin conexión.'}</p>
        {needRefresh ? (
          <Button size="sm" onClick={() => updateServiceWorker(true)}>Actualizar</Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => setOfflineReady(false)}>OK</Button>
        )}
        {needRefresh && (
          <Button size="sm" variant="ghost" onClick={() => setNeedRefresh(false)}>Luego</Button>
        )}
      </div>
    </div>
  );
}
