import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { cn } from '@/utils/cn';
import { PAGE_SIZE_OPTIONS } from '@/lib/constants';
import { formatNumero } from '@/utils/format';
import { EmptyState, Skeleton } from './Feedback';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T) => ReactNode;
  className?: string;
  align?: 'left' | 'right' | 'center';
  /** Ocultar en pantallas pequeñas */
  hideOnMobile?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  fetching?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (p: number) => void;
    onPageSizeChange?: (s: number) => void;
  };
  onRowClick?: (row: T) => void;
  footer?: ReactNode;
}

export function DataTable<T>({
  columns, data, rowKey, loading, fetching, emptyTitle = 'Sin resultados', emptyDescription, emptyAction,
  pagination, onRowClick, footer,
}: DataTableProps<T>) {
  const alinear = (a?: string) => (a === 'right' ? 'text-right' : a === 'center' ? 'text-center' : '');

  return (
    <div className="card overflow-hidden">
      <div className={cn('relative overflow-x-auto', fetching && !loading && 'opacity-70 transition-opacity')}>
        <table className="min-w-full divide-y divide-zinc-100 dark:divide-white/[0.06]">
          <thead className="bg-zinc-50/80 dark:bg-white/[0.02]">
            <tr>
              {columns.map((c) => (
                <th key={c.key} scope="col" className={cn('th', alinear(c.align), c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                  {c.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((c) => (
                      <td key={c.key} className={cn('td', c.hideOnMobile && 'hidden md:table-cell')}>
                        <Skeleton className="h-4 w-full max-w-[140px]" />
                      </td>
                    ))}
                  </tr>
                ))
              : data.map((row) => (
                  <tr
                    key={rowKey(row)}
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn('transition-colors hover:bg-zinc-50/70 dark:hover:bg-white/[0.02]', onRowClick && 'cursor-pointer')}
                  >
                    {columns.map((c) => (
                      <td key={c.key} className={cn('td', alinear(c.align), c.hideOnMobile && 'hidden md:table-cell', c.className)}>
                        {c.cell(row)}
                      </td>
                    ))}
                  </tr>
                ))}
          </tbody>
          {footer && !loading && data.length > 0 && <tfoot className="border-t border-zinc-200 bg-zinc-50/80 dark:border-white/10 dark:bg-white/[0.02]">{footer}</tfoot>}
        </table>
        {!loading && data.length === 0 && <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />}
      </div>
      {pagination && pagination.total > 0 && <Paginacion {...pagination} />}
    </div>
  );
}

function Paginacion({ page, pageSize, total, onPageChange, onPageSizeChange }: NonNullable<DataTableProps<unknown>['pagination']>) {
  const paginas = Math.max(1, Math.ceil(total / pageSize));
  const desde = (page - 1) * pageSize + 1;
  const hasta = Math.min(page * pageSize, total);
  const btn = 'inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-500 hover:bg-zinc-100 disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/[0.06]';

  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-zinc-100 px-4 py-3 text-xs text-zinc-500 sm:flex-row dark:border-white/[0.06]">
      <div className="flex items-center gap-3">
        <span>
          {formatNumero(desde)}–{formatNumero(hasta)} de {formatNumero(total)}
        </span>
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-md border border-zinc-200 bg-transparent px-2 py-1 dark:border-white/10"
            aria-label="Filas por página"
          >
            {PAGE_SIZE_OPTIONS.map((s) => (
              <option key={s} value={s}>{s} / pág.</option>
            ))}
          </select>
        )}
      </div>
      <div className="flex items-center gap-1">
        <button className={btn} onClick={() => onPageChange(1)} disabled={page <= 1} aria-label="Primera página"><ChevronsLeft className="h-4 w-4" /></button>
        <button className={btn} onClick={() => onPageChange(page - 1)} disabled={page <= 1} aria-label="Página anterior"><ChevronLeft className="h-4 w-4" /></button>
        <span className="px-2 font-medium text-zinc-700 dark:text-zinc-300">{page} / {paginas}</span>
        <button className={btn} onClick={() => onPageChange(page + 1)} disabled={page >= paginas} aria-label="Página siguiente"><ChevronRight className="h-4 w-4" /></button>
        <button className={btn} onClick={() => onPageChange(paginas)} disabled={page >= paginas} aria-label="Última página"><ChevronsRight className="h-4 w-4" /></button>
      </div>
    </div>
  );
}
