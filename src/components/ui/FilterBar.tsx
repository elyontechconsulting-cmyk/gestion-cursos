import { useState, type ReactNode } from 'react';
import { FilterX, SlidersHorizontal } from 'lucide-react';
import { Button } from './Button';
import { SearchInput } from './SearchInput';
import { cn } from '@/utils/cn';

/** Barra con búsqueda instantánea y panel de filtros avanzados plegable. */
export function FilterBar({ search, onSearch, placeholder, children, onClear, activos = 0, extra }: {
  search: string;
  onSearch: (v: string) => void;
  placeholder?: string;
  children?: ReactNode;
  onClear?: () => void;
  activos?: number;
  extra?: ReactNode;
}) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchInput value={search} onChange={onSearch} placeholder={placeholder} className="sm:max-w-sm sm:flex-1" />
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          {children && (
            <Button variant="outline" size="md" icon={<SlidersHorizontal className="h-4 w-4" />} onClick={() => setAbierto((v) => !v)}>
              Filtros{activos > 0 && <span className="rounded bg-brand-600 px-1.5 text-[10px] text-white">{activos}</span>}
            </Button>
          )}
          {onClear && (activos > 0 || search) && (
            <Button variant="ghost" icon={<FilterX className="h-4 w-4" />} onClick={onClear}>Limpiar</Button>
          )}
          {extra}
        </div>
      </div>
      {children && (
        <div className={cn('card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4', !abierto && 'hidden')}>{children}</div>
      )}
    </div>
  );
}
