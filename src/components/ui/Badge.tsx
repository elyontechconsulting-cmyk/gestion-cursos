import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';
import { TONO_ESTADO, type Tono } from '@/lib/constants';

const tonos: Record<Tono, string> = {
  gray: 'bg-zinc-100 text-zinc-700 ring-zinc-200 dark:bg-white/[0.06] dark:text-zinc-300 dark:ring-white/10',
  blue: 'bg-blue-50 text-blue-700 ring-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/20',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-500/20',
  red: 'bg-red-50 text-red-700 ring-red-200 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-500/20',
  violet: 'bg-violet-50 text-violet-700 ring-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:ring-violet-500/20',
};

export function Badge({ tono = 'gray', children, className }: { tono?: Tono; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset', tonos[tono], className)}>
      {children}
    </span>
  );
}

/** Badge que elige el color según el valor del estado (programado, pagado, etc.). */
export function EstadoBadge({ valor, etiquetas }: { valor: string; etiquetas: Record<string, string> }) {
  return (
    <Badge tono={TONO_ESTADO[valor] ?? 'gray'}>
      <span className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {etiquetas[valor] ?? valor}
    </Badge>
  );
}
