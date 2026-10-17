import { supabase } from '@/lib/supabase';
import type { Configuracion } from '@/types/database';
import type { ConfiguracionInput } from '@/schemas/configuracion.schema';
import { limpiar, unwrap } from './helpers';

export const configuracionApi = {
  async obtener(): Promise<Configuracion> {
    return unwrap(await supabase.from('configuracion').select('*').eq('id', 1).single());
  },

  async actualizar(input: ConfiguracionInput): Promise<Configuracion> {
    return unwrap(await supabase.from('configuracion').update(limpiar(input)).eq('id', 1).select().single());
  },
};
