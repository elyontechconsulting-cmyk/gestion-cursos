import { useUiStore } from '@/store/ui.store';
import { useSyncExternalStore } from 'react';

// Paleta categórica validada (orden fijo, nunca cíclico) para modo claro y oscuro,
// y paleta de estados reservada (siempre acompañada de etiqueta).
const CATEGORICA = {
  light: ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#6250d6', '#e34948'],
  dark: ['#3987e5', '#d95926', '#199e70', '#c98500', '#d55181', '#008300', '#9085e9', '#e66767'],
};
export const ESTADO_COLOR = { pagado: '#0ca30c', parcial: '#fab219', pendiente: '#d03b3b' } as const;

const subscribe = (cb: () => void) => {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  return () => obs.disconnect();
};

/** Colores de gráficos según el tema activo (Recharts no lee variables CSS en atributos SVG). */
export function useChartTheme() {
  useUiStore((s) => s.tema);
  const oscuro = useSyncExternalStore(subscribe, () => document.documentElement.classList.contains('dark'), () => false);
  const modo = oscuro ? 'dark' : 'light';
  return {
    series: CATEGORICA[modo],
    principal: CATEGORICA[modo][0],
    texto: oscuro ? '#a1a1aa' : '#52514e',
    grid: oscuro ? 'rgba(255,255,255,0.06)' : '#ececea',
    superficie: oscuro ? '#111318' : '#ffffff',
    tooltip: {
      contentStyle: {
        background: oscuro ? '#14161c' : '#ffffff',
        border: `1px solid ${oscuro ? 'rgba(255,255,255,0.1)' : '#e4e4e7'}`,
        borderRadius: 8,
        fontSize: 12,
        color: oscuro ? '#e4e4e7' : '#18181b',
      },
      cursor: { fill: oscuro ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' },
    },
  };
}

/** Formato compacto para ejes: S/ 1.2 mil */
export const monedaCompacta = (v: number) =>
  `S/ ${new Intl.NumberFormat('es-PE', { notation: 'compact', maximumFractionDigits: 1 }).format(v)}`;
