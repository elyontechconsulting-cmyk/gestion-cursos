import { useEffect, useRef, useState } from 'react';
import { Check, ChevronsUpDown, Loader2, UserPlus } from 'lucide-react';
import { useBuscarEstudiantes } from '@/hooks/useEstudiantes';
import { useDebounce } from '@/hooks/useDebounce';
import { nombreCompleto } from '@/utils/format';
import { cn } from '@/utils/cn';
import type { Estudiante } from '@/types/database';

/** Selector con búsqueda instantánea de estudiantes (por DNI o nombre). */
export function EstudianteCombobox({ value, onChange, invalid, onNuevo }: {
  value: Estudiante | null;
  onChange: (e: Estudiante | null) => void;
  invalid?: boolean;
  onNuevo?: () => void;
}) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const debounced = useDebounce(texto, 250);
  const { data = [], isFetching } = useBuscarEstudiantes(abierto ? debounced : '');
  const ref = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState(0);

  useEffect(() => {
    const onClick = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAbierto(false);
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  useEffect(() => setActivo(0), [data]);

  const elegir = (e: Estudiante) => {
    onChange(e);
    setAbierto(false);
    setTexto('');
  };

  return (
    <div ref={ref} className="relative">
      <div className={cn('input flex items-center gap-2 p-0', invalid && 'input-error')}>
        <input
          className="w-full bg-transparent px-3 py-2 text-sm outline-none"
          placeholder={value ? `${value.dni} · ${nombreCompleto(value)}` : 'Buscar por DNI o nombre…'}
          value={abierto ? texto : value ? `${value.dni} · ${nombreCompleto(value)}` : ''}
          onFocus={() => setAbierto(true)}
          onChange={(e) => { setTexto(e.target.value); setAbierto(true); }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setActivo((a) => Math.min(a + 1, data.length - 1)); }
            if (e.key === 'ArrowUp') { e.preventDefault(); setActivo((a) => Math.max(a - 1, 0)); }
            if (e.key === 'Enter' && abierto && data[activo]) { e.preventDefault(); elegir(data[activo]); }
            if (e.key === 'Escape') setAbierto(false);
          }}
          role="combobox"
          aria-expanded={abierto}
          aria-autocomplete="list"
        />
        {isFetching ? <Loader2 className="mr-3 h-4 w-4 animate-spin text-zinc-400" /> : <ChevronsUpDown className="mr-3 h-4 w-4 text-zinc-400" />}
      </div>
      {abierto && (
        <ul role="listbox" className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#1a1d24]">
          {data.length === 0 && !isFetching && <li className="px-3 py-2 text-sm text-zinc-500">Sin resultados</li>}
          {data.map((e, i) => (
            <li
              key={e.id}
              role="option"
              aria-selected={value?.id === e.id}
              onMouseDown={(ev) => { ev.preventDefault(); elegir(e); }}
              onMouseEnter={() => setActivo(i)}
              className={cn('flex cursor-pointer items-center justify-between px-3 py-2 text-sm', i === activo && 'bg-zinc-100 dark:bg-white/[0.06]')}
            >
              <span><span className="font-mono text-xs text-zinc-500">{e.dni}</span> · {nombreCompleto(e)}</span>
              {value?.id === e.id && <Check className="h-4 w-4 text-brand-600" />}
            </li>
          ))}
          {onNuevo && (
            <li
              onMouseDown={(ev) => { ev.preventDefault(); setAbierto(false); onNuevo(); }}
              className="flex cursor-pointer items-center gap-2 border-t border-zinc-100 px-3 py-2 text-sm font-medium text-brand-600 hover:bg-zinc-50 dark:border-white/[0.06] dark:text-brand-400 dark:hover:bg-white/[0.04]"
            >
              <UserPlus className="h-4 w-4" /> Registrar nuevo estudiante
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
