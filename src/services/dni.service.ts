import { supabase } from '@/lib/supabase';

export interface DatosDni {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  /** YYYY-MM-DD; solo lo devuelve la API gratuita */
  fechaNacimiento?: string | null;
  fuente?: 'scrall' | 'apisperu';
}

const cache = new Map<string, DatosDni>();

/**
 * Consulta la API de DNI (apisperu.com) a través de la Edge Function `consulta-dni`.
 * El token NUNCA viaja al navegador: vive como secreto APISPERU_TOKEN en Supabase.
 */
export async function consultarDni(dni: string, signal?: AbortSignal): Promise<DatosDni> {
  if (!/^\d{8}$/.test(dni)) throw new Error('El DNI debe tener 8 dígitos');
  const enCache = cache.get(dni);
  if (enCache) return enCache;

  const { data, error } = await supabase.functions.invoke<DatosDni & { error?: string }>(
    `consulta-dni?dni=${encodeURIComponent(dni)}`,
    { method: 'GET', signal } as Parameters<typeof supabase.functions.invoke>[1],
  );

  if (error) {
    // Solo FunctionsHttpError trae un Response en `context`; los errores de red/relay no.
    const ctx = (error as { context?: unknown }).context;
    const body = ctx instanceof Response ? await ctx.json().catch(() => null) : null;
    throw new Error(body?.error ?? 'No se pudo conectar con el servicio de DNI');
  }
  if (!data || data.error) throw new Error(data?.error ?? 'DNI no encontrado');

  cache.set(dni, data);
  return data;
}
