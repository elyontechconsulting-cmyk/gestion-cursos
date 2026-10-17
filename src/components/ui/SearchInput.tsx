import { Search, X } from 'lucide-react';
import { cn } from '@/utils/cn';

export function SearchInput({ value, onChange, placeholder = 'Buscar…', className }: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input pl-9 pr-8 [&::-webkit-search-cancel-button]:hidden"
        aria-label={placeholder}
      />
      {value && (
        <button onClick={() => onChange('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-zinc-400 hover:text-zinc-700" aria-label="Limpiar búsqueda">
          <X className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}
