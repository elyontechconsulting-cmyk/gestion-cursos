import type { PostgrestError } from '@supabase/supabase-js';
import type { PageParams, Paginated } from '@/types/common';

export class ApiError extends Error {
  code?: string;
  status?: number;
  details?: string;
  constructor(err: PostgrestError | { message: string; code?: string }, status?: number) {
    super(err.message);
    this.code = err.code;
    this.status = status;
    this.details = 'details' in err ? err.details : undefined;
  }
}

/** Lanza un ApiError si la respuesta de Supabase trae error; si no, devuelve data. */
export function unwrap<T>(res: { data: T | null; error: PostgrestError | null; status?: number }): T {
  if (res.error) throw new ApiError(res.error, res.status);
  return res.data as T;
}

export function unwrapPage<T>(res: {
  data: T[] | null;
  error: PostgrestError | null;
  count: number | null;
  status?: number;
}): Paginated<T> {
  if (res.error) throw new ApiError(res.error, res.status);
  return { data: res.data ?? [], count: res.count ?? 0 };
}

export function rango({ page, pageSize }: PageParams): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

/** Escapa caracteres reservados de los filtros `or()` de PostgREST. */
export function textoBusqueda(s?: string): string | null {
  const t = (s ?? '').trim().replace(/[%,()*\\:"]/g, ' ').replace(/\s+/g, ' ');
  return t.length ? t : null;
}

/** Quita strings vacíos (se guardan como NULL). */
export function limpiar<T extends Record<string, unknown>>(obj: T): T {
  const out = { ...obj };
  for (const k of Object.keys(out)) {
    if (out[k] === '') (out as Record<string, unknown>)[k] = null;
  }
  return out;
}
