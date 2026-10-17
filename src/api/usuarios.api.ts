import { supabase } from '@/lib/supabase';
import type { Auditoria, Rol, Usuario } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { UsuarioInput } from '@/schemas/auth.schema';
import { ApiError, rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export const usuariosApi = {
  async perfil(id: string): Promise<Usuario | null> {
    return unwrap(
      await supabase.from('usuarios').select('*, roles(codigo, nombre)').eq('id', id).is('deleted_at', null).maybeSingle(),
    );
  },

  async listar(f: PageParams): Promise<Paginated<Usuario>> {
    let q = supabase.from('usuarios').select('*, roles(codigo, nombre)', { count: 'exact' }).is('deleted_at', null);
    const t = textoBusqueda(f.search);
    if (t) q = q.or(`email.ilike.%${t}%,nombre_completo.ilike.%${t}%`);
    return unwrapPage(await q.order('created_at', { ascending: false }).range(...rango(f)));
  },

  async roles(): Promise<Rol[]> {
    return unwrap(await supabase.from('roles').select('*').order('id'));
  },

  async actualizar(id: string, cambios: Partial<Pick<Usuario, 'rol_id' | 'activo' | 'nombre_completo'>>): Promise<void> {
    unwrap(await supabase.from('usuarios').update(cambios).eq('id', id));
  },

  /** Crea o invita un usuario mediante la Edge Function (usa service_role en el servidor). */
  async crear(input: UsuarioInput): Promise<void> {
    const { data, error } = await supabase.functions.invoke('crear-usuario', {
      body: { ...input, password: input.password || undefined },
    });
    if (error) {
      // Solo FunctionsHttpError trae un Response en `context`; los errores de red/relay no.
      const ctx = (error as { context?: unknown }).context;
      const body = ctx instanceof Response ? await ctx.json().catch(() => null) : null;
      throw new ApiError({ message: body?.error ?? error.message });
    }
    if (data?.error) throw new ApiError({ message: data.error });
  },
};

export interface AuditoriaFiltros extends PageParams {
  tabla?: string;
  accion?: string;
  desde?: string;
  hasta?: string;
}

export const auditoriaApi = {
  async listar(f: AuditoriaFiltros): Promise<Paginated<Auditoria>> {
    let q = supabase.from('auditoria').select('*', { count: 'exact' });
    const t = textoBusqueda(f.search);
    if (t) q = q.or(`usuario_email.ilike.%${t}%,registro_id.ilike.%${t}%`);
    if (f.tabla) q = q.eq('tabla', f.tabla);
    if (f.accion) q = q.eq('accion', f.accion);
    if (f.desde) q = q.gte('fecha', `${f.desde}T00:00:00-05:00`);
    if (f.hasta) q = q.lte('fecha', `${f.hasta}T23:59:59-05:00`);
    return unwrapPage(await q.order('fecha', { ascending: false }).range(...rango(f)));
  },
};
