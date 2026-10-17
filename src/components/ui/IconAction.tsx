import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/utils/cn';

/** Botón de icono para acciones de fila, con tooltip nativo. No propaga el clic a la fila. */
export function IconAction({ label, children, danger, className, onClick, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string;
  children: ReactNode;
  danger?: boolean;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.(e);
      }}
      className={cn(
        'inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-white/[0.07] dark:hover:text-zinc-100',
        danger && 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
