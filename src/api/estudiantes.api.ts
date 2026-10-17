import { supabase } from '@/lib/supabase';
import type { Estudiante, EstadoRegistro } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { EstudianteInput } from '@/schemas/estudiante.schema';
import { rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export interface EstudianteFiltros extends PageParams {
  estado?: EstadoRegistro | '';
}

export const estudiantesApi = {
  async listar(f: EstudianteFiltros): Promise<Paginated<Estudiante>> {
    let q = supabase.from('estudiantes').select('*', { count: 'exact' }).is('deleted_at', null);
    const t = textoBusqueda(f.search);
    if (t) {
      q = /^\d+$/.test(t)
        ? q.like('dni', `${t}%`)
        : q.or(`nombres.ilike.%${t}%,apellido_paterno.ilike.%${t}%,apellido_materno.ilike.%${t}%,correo.ilike.%${t}%`);
    }
    if (f.estado) q = q.eq('estado', f.estado);
    return unwrapPage(await q.order('created_at', { ascending: false }).range(...rango(f)));
  },

  async buscar(texto: string, limite = 10): Promise<Estudiante[]> {
    let q = supabase.from('estudiantes').select('*').is('deleted_at', null).eq('estado', 'activo');
    const t = textoBusqueda(texto);
    if (t) {
      q = /^\d+$/.test(t)
        ? q.like('dni', `${t}%`)
        : q.or(`nombres.ilike.%${t}%,apellido_paterno.ilike.%${t}%,apellido_materno.ilike.%${t}%`);
    }
    return unwrap(await q.order('apellido_paterno').limit(limite));
  },

  async porDni(dni: string): Promise<Estudiante | null> {
    return unwrap(await supabase.from('estudiantes').select('*').eq('dni', dni).is('deleted_at', null).maybeSingle());
  },

  async crear(input: EstudianteInput): Promise<Estudiante> {
    return unwrap(await supabase.from('estudiantes').insert(input).select().single());
  },

  async actualizar(id: string, input: Partial<EstudianteInput>): Promise<Estudiante> {
    return unwrap(await supabase.from('estudiantes').update(input).eq('id', id).select().single());
  },

  async eliminar(id: string): Promise<void> {
    unwrap(await supabase.from('estudiantes').update({ deleted_at: new Date().toISOString() }).eq('id', id));
  },
};
