import { useEffect, useState } from 'react';
import { useDebounce } from './useDebounce';

/** Estado de tabla: página, tamaño, búsqueda instantánea (con debounce) y filtros. */
export function usePaginacion<F extends Record<string, unknown>>(filtrosIniciales: F, pageSizeInicial = 10) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(pageSizeInicial);
  const [search, setSearch] = useState('');
  const [filtros, setFiltros] = useState<F>(filtrosIniciales);
  const debouncedSearch = useDebounce(search, 300);

  // Volver a la página 1 cuando cambian búsqueda o filtros
  useEffect(() => setPage(1), [debouncedSearch, filtros, pageSize]);

  return {
    page, setPage, pageSize, setPageSize, search, setSearch, filtros,
    setFiltro: <K extends keyof F>(k: K, v: F[K]) => setFiltros((f) => ({ ...f, [k]: v })),
    limpiarFiltros: () => { setFiltros(filtrosIniciales); setSearch(''); },
    params: { page, pageSize, search: debouncedSearch, ...filtros },
  };
}
