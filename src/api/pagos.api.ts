import { supabase } from '@/lib/supabase';
import type { MedioPago, Pago, PagoDetalle } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { PagoInput } from '@/schemas/pago.schema';
import { limpiar, rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export interface PagoFiltros extends PageParams {
  cursoId?: string;
  medio?: MedioPago | '';
  desde?: string;
  hasta?: string;
}

export const pagosApi = {
  async listar(f: PagoFiltros): Promise<Paginated<PagoDetalle>> {
    let q = supabase.from('v_pagos_detalle').select('*', { count: 'exact' });
    const t = textoBusqueda(f.search);
    if (t) {
      q = /^\d+$/.test(t)
        ? q.or(`dni.like.${t}%,numero_operacion.like.${t}%`)
        : q.or(`estudiante_nombre.ilike.%${t}%,curso_nombre.ilike.%${t}%,numero_operacion.ilike.%${t}%`);
    }
    if (f.cursoId) q = q.eq('curso_id', f.cursoId);
    if (f.medio) q = q.eq('medio_pago', f.medio);
    if (f.desde) q = q.gte('fecha_pago', f.desde);
    if (f.hasta) q = q.lte('fecha_pago', f.hasta);
    return unwrapPage(await q.order('fecha_pago', { ascending: false }).order('created_at', { ascending: false }).range(...rango(f)));
  },

  async todos(f: Omit<PagoFiltros, 'page' | 'pageSize'> = {}): Promise<PagoDetalle[]> {
    let q = supabase.from('v_pagos_detalle').select('*');
    if (f.cursoId) q = q.eq('curso_id', f.cursoId);
    if (f.desde) q = q.gte('fecha_pago', f.desde);
    if (f.hasta) q = q.lte('fecha_pago', f.hasta);
    return unwrap(await q.order('fecha_pago').limit(20000));
  },

  async historial(inscripcionId: string): Promise<PagoDetalle[]> {
    return unwrap(
      await supabase.from('v_pagos_detalle').select('*').eq('inscripcion_id', inscripcionId).order('fecha_pago', { ascending: false }),
    );
  },

  async registrar(input: PagoInput): Promise<Pago> {
    return unwrap(await supabase.from('pagos').insert(limpiar(input)).select().single());
  },

  async anular(id: string, motivo: string): Promise<void> {
    unwrap(
      await supabase
        .from('pagos')
        .update({ deleted_at: new Date().toISOString(), observaciones: `ANULADO: ${motivo}` })
        .eq('id', id),
    );
  },
};
