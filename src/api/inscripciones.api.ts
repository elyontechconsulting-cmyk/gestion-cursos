import { supabase } from '@/lib/supabase';
import type { EstadoInscripcion, EstadoPago, Inscripcion, InscripcionDetalle } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { InscripcionInput } from '@/schemas/inscripcion.schema';
import { limpiar, rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export interface InscripcionFiltros extends PageParams {
  cursoId?: string;
  estudianteId?: string;
  estado?: EstadoInscripcion | '';
  /** Uno o varios estados; vacío = todos */
  estadoPago?: EstadoPago | EstadoPago[] | '';
  desde?: string;
  hasta?: string;
}

function aplicarFiltros<Q extends { eq: Function; in: Function; gte: Function; lte: Function; or: Function; like: Function }>(
  q: Q,
  f: Omit<InscripcionFiltros, 'page' | 'pageSize'>,
): Q {
  const t = textoBusqueda(f.search);
  if (t) {
    q = /^\d+$/.test(t)
      ? q.like('dni', `${t}%`)
      : q.or(`estudiante_nombre.ilike.%${t}%,curso_nombre.ilike.%${t}%,curso_codigo.ilike.%${t}%`);
  }
  if (f.cursoId) q = q.eq('curso_id', f.cursoId);
  if (f.estudianteId) q = q.eq('estudiante_id', f.estudianteId);
  if (f.estado) q = q.eq('estado', f.estado);
  if (Array.isArray(f.estadoPago)) {
    if (f.estadoPago.length) q = q.in('estado_pago', f.estadoPago);
  } else if (f.estadoPago) {
    q = q.eq('estado_pago', f.estadoPago);
  }
  if (f.desde) q = q.gte('fecha_inscripcion', f.desde);
  if (f.hasta) q = q.lte('fecha_inscripcion', f.hasta);
  return q;
}

export const inscripcionesApi = {
  async listar(f: InscripcionFiltros): Promise<Paginated<InscripcionDetalle>> {
    const q = aplicarFiltros(supabase.from('v_inscripciones_detalle').select('*', { count: 'exact' }), f);
    return unwrapPage(await q.order('fecha_inscripcion', { ascending: false }).order('created_at', { ascending: false }).range(...rango(f)));
  },

  /** Sin paginar (reportes y exportaciones). */
  async todas(f: Omit<InscripcionFiltros, 'page' | 'pageSize'> = {}): Promise<InscripcionDetalle[]> {
    const q = aplicarFiltros(supabase.from('v_inscripciones_detalle').select('*'), f);
    return unwrap(await q.order('curso_nombre').order('estudiante_nombre').limit(10000));
  },

  async obtener(id: string): Promise<InscripcionDetalle> {
    return unwrap(await supabase.from('v_inscripciones_detalle').select('*').eq('id', id).single());
  },

  async crear(input: InscripcionInput): Promise<Inscripcion> {
    return unwrap(await supabase.from('inscripciones').insert(limpiar(input)).select().single());
  },

  async cambiarEstado(id: string, estado: EstadoInscripcion, observacion?: string): Promise<void> {
    const cambios: Record<string, unknown> = { estado };
    if (observacion !== undefined) cambios.observacion = observacion || null;
    unwrap(await supabase.from('inscripciones').update(cambios).eq('id', id));
  },

  async anular(id: string): Promise<void> {
    const { count } = await supabase
      .from('pagos')
      .select('id', { count: 'exact', head: true })
      .eq('inscripcion_id', id)
      .is('deleted_at', null);
    if (count && count > 0) throw new Error('La inscripción tiene pagos registrados. Anule los pagos o márquela como retirada.');
    unwrap(await supabase.from('inscripciones').update({ deleted_at: new Date().toISOString() }).eq('id', id));
  },
};
