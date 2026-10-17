import { useEffect, type ReactNode } from 'react';
import { aplicarTema, useUiStore } from '@/store/ui.store';

/** Sincroniza el tema (claro/oscuro/sistema) con el DOM y con el sistema operativo. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const tema = useUiStore((s) => s.tema);

  useEffect(() => {
    aplicarTema(tema);
    if (tema !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => aplicarTema('system');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [tema]);

  return <>{children}</>;
}
