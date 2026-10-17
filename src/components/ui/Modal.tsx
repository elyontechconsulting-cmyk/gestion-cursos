import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/utils/cn';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: ReactNode;
  footer?: ReactNode;
}

const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };

export function Modal({ open, onClose, title, description, size = 'md', children, footer }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);

  // El modal solo se cierra con la X o con los botones del footer (sin Escape ni clic fuera)
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    setTimeout(() => ref.current?.querySelector<HTMLElement>('input:not([disabled]),select,textarea')?.focus(), 50);
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div className="absolute inset-0 bg-zinc-950/40 backdrop-blur-[2px]" />
      <div
        ref={ref}
        className={cn(
          'relative flex max-h-[92vh] w-full animate-fade-in flex-col rounded-t-2xl border border-zinc-200 bg-white shadow-2xl sm:rounded-2xl dark:border-white/10 dark:bg-[#14161c]',
          sizes[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
          <div>
            <h2 id="modal-title" className="text-base font-semibold">{title}</h2>
            {description && <p className="mt-0.5 text-sm text-zinc-500">{description}</p>}
          </div>
          <button onClick={onClose} className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/10" aria-label="Cerrar">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3 pb-safe dark:border-white/[0.06]">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
