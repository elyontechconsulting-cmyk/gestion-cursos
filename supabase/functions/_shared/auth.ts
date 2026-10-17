import { createClient, type SupabaseClient } from 'jsr:@supabase/supabase-js@2';

export type Rol = 'administrador' | 'operador' | 'consulta';

/** Valida el JWT del usuario y devuelve su rol leyendo la BD con sus propios permisos (RLS). */
export async function usuarioConRol(req: Request): Promise<{ client: SupabaseClient; userId: string; rol: Rol | null }> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) throw new HttpError(401, 'No autenticado');

  const client = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userData, error } = await client.auth.getUser();
  if (error || !userData.user) throw new HttpError(401, 'Sesión inválida o expirada');

  const { data: rol } = await client.rpc('fn_rol_actual');
  return { client, userId: userData.user.id, rol: (rol as Rol | null) ?? null };
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
