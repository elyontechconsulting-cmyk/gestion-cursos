import { supabase } from '@/lib/supabase';
import type { DashboardResumen, RecaudacionMensual } from '@/types/database';
import { unwrap } from './helpers';

export const dashboardApi = {
  async resumen(): Promise<DashboardResumen> {
    return unwrap(await supabase.rpc('fn_dashboard_resumen')) as DashboardResumen;
  },
  async recaudacionMensual(desde?: string, hasta?: string): Promise<RecaudacionMensual[]> {
    const rows = unwrap(
      await supabase.rpc('fn_recaudacion_mensual', { p_desde: desde || null, p_hasta: hasta || null }),
    ) as RecaudacionMensual[];
    return rows.map((r) => ({ ...r, total: Number(r.total), cantidad: Number(r.cantidad) }));
  },
};
