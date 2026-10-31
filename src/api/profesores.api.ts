import { supabase } from '@/lib/supabase';
import type { EstadoRegistro, Profesor } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { ProfesorInput } from '@/schemas/profesor.schema';
import { rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export interface ProfesorFiltros extends PageParams {
  estado?: EstadoRegistro | '';
}

export type ProfesorOpcion = Pick<Profesor, 'id' | 'nombres' | 'apellidos' | 'especialidad'>;

export const profesoresApi = {
  async listar(f: ProfesorFiltros): Promise<Paginated<Profesor>> {
    let q = supabase.from('profesores').select('*', { count: 'exact' }).is('deleted_at', null);
    const t = textoBusqueda(f.search);
    if (t) {
      q = /^\d+$/.test(t)
        ? q.like('dni', `${t}%`)
        : q.or(`nombres.ilike.%${t}%,apellidos.ilike.%${t}%,especialidad.ilike.%${t}%`);
    }
    if (f.estado) q = q.eq('estado', f.estado);
    return unwrapPage(await q.order('apellidos').order('nombres').range(...rango(f)));
  },

  /** Profesores activos para asignar a cursos. */
  async opciones(): Promise<ProfesorOpcion[]> {
    return unwrap(
      await supabase
        .from('profesores')
        .select('id, nombres, apellidos, especialidad')
        .is('deleted_at', null)
        .eq('estado', 'activo')
        .order('apellidos')
        .order('nombres'),
    );
  },

  async porDni(dni: string): Promise<Profesor | null> {
    return unwrap(await supabase.from('profesores').select('*').eq('dni', dni).is('deleted_at', null).maybeSingle());
  },

  async crear(input: ProfesorInput): Promise<Profesor> {
    return unwrap(await supabase.from('profesores').insert(input).select().single());
  },

  async actualizar(id: string, input: ProfesorInput): Promise<Profesor> {
    return unwrap(await supabase.from('profesores').update(input).eq('id', id).select().single());
  },

  async eliminar(id: string): Promise<void> {
    unwrap(await supabase.from('profesores').update({ deleted_at: new Date().toISOString() }).eq('id', id));
  },
};
