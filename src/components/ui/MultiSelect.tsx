import { useEffect, useRef, useState } from 'react';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/utils/cn';

interface MultiSelectProps<T extends string> {
  options: { value: T; label: string }[];
  /** Valores marcados. Vacío equivale a "Todos" (sin filtro). */
  value: T[];
  onChange: (value: T[]) => void;
  todosLabel?: string;
  className?: string;
}

/** Combo desplegable con casillas y una opción "Todos". */
export function MultiSelect<T extends string>({ options, value, onChange, todosLabel = 'Todos', className }: MultiSelectProps<T>) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const todos = value.length === 0 || value.length === options.length;

  // Se cierra al hacer clic fuera o con Escape (es un desplegable, no un modal)
  useEffect(() => {
    if (!abierto) return;
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setAbierto(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [abierto]);

  const toggle = (v: T) => {
    const base = value.length === 0 ? options.map((o) => o.value) : value;
    onChange(base.includes(v) ? base.filter((x) => x !== v) : [...base, v]);
  };

  const resumen = todos
    ? todosLabel
    : options.filter((o) => value.includes(o.value)).map((o) => o.label).join(', ');

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setAbierto((a) => !a)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        className="input flex items-center justify-between gap-2 text-left"
      >
        <span className="truncate">{resumen}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 text-zinc-400 transition-transform', abierto && 'rotate-180')} />
      </button>
      {abierto && (
        <ul
          role="listbox"
          aria-multiselectable="true"
          className="absolute z-30 mt-1 w-full min-w-[10rem] overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 text-sm shadow-lg dark:border-white/10 dark:bg-[#14161c]"
        >
          <Opcion label={todosLabel} marcado={todos} onClick={() => onChange(options.map((o) => o.value))} />
          <li className="my-1 border-t border-zinc-100 dark:border-white/[0.06]" role="separator" />
          {options.map((o) => (
            <Opcion key={o.value} label={o.label} marcado={todos || value.includes(o.value)} onClick={() => toggle(o.value)} />
          ))}
        </ul>
      )}
    </div>
  );
}

function Opcion({ label, marcado, onClick }: { label: string; marcado: boolean; onClick: () => void }) {
  return (
    <li role="option" aria-selected={marcado}>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-zinc-50 dark:hover:bg-white/[0.05]"
      >
        <span
          className={cn(
            'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
            marcado ? 'border-brand-600 bg-brand-600 text-white' : 'border-zinc-300 dark:border-white/20',
          )}
        >
          {marcado && <Check className="h-3 w-3" strokeWidth={3} />}
        </span>
        {label}
      </button>
    </li>
  );
}
