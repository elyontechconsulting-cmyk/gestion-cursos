import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

export function Card({ title, description, actions, children, className, bodyClassName }: {
  title?: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn('card', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3.5 dark:border-white/[0.06]">
          <div>
            {title && <h3 className="text-sm font-semibold">{title}</h3>}
            {description && <p className="text-xs text-zinc-500">{description}</p>}
          </div>
          {actions}
        </header>
      )}
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </section>
  );
}

export function StatCard({ label, value, icon, hint, tono = 'brand' }: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  hint?: ReactNode;
  tono?: 'brand' | 'green' | 'amber' | 'red' | 'blue' | 'violet';
}) {
  const t = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-500/10 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300',
    red: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-300',
    blue: 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300',
  }[tono];
  return (
    <div className="card flex items-start gap-4 p-4">
      <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg', t)}>{icon}</div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{label}</p>
        <p className="mt-0.5 truncate text-xl font-semibold tracking-tight">{value}</p>
        {hint && <p className="mt-0.5 text-xs text-zinc-500">{hint}</p>}
      </div>
    </div>
  );
}
