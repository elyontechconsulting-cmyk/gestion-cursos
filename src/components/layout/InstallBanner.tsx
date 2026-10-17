import { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePwaInstall } from '@/hooks/usePwaInstall';
import { Button } from '@/components/ui';

const CLAVE = 'gc-install-dismissed';

/** Invita a instalar la app: botón nativo en Android/Chrome, instrucciones en iPhone/iPad. */
export function InstallBanner() {
  const { puedeInstalar, esIOS, instalar } = usePwaInstall();
  const [oculto, setOculto] = useState(() => {
    try { return localStorage.getItem(CLAVE) === '1'; } catch { return false; }
  });

  if (oculto || (!puedeInstalar && !esIOS)) return null;

  const cerrar = () => {
    setOculto(true);
    try { localStorage.setItem(CLAVE, '1'); } catch { /* sin almacenamiento */ }
  };

  return (
    <div className="fixed inset-x-3 bottom-3 z-40 mx-auto max-w-md animate-fade-in pb-safe">
      <div className="card flex items-start gap-3 p-4 shadow-xl">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <Download className="h-4 w-4" />
        </div>
        <div className="flex-1 text-sm">
          <p className="font-medium">Instala la aplicación</p>
          {esIOS ? (
            <p className="mt-0.5 text-zinc-500">
              Toca <Share className="inline h-3.5 w-3.5" /> <b>Compartir</b> y luego <b>“Agregar a inicio”</b>.
            </p>
          ) : (
            <p className="mt-0.5 text-zinc-500">Accede más rápido y úsala sin conexión.</p>
          )}
          {puedeInstalar && (
            <Button size="sm" className="mt-2" onClick={async () => { if (await instalar()) cerrar(); }}>
              Instalar
            </Button>
          )}
        </div>
        <button onClick={cerrar} className="rounded p-1 text-zinc-400 hover:text-zinc-700" aria-label="Cerrar">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
