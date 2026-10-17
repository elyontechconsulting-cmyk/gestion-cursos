// Edge Function: crear-usuario
// Permite a un administrador invitar/crear usuarios del sistema con un rol.
// Usa la service_role key SOLO en el servidor. Nunca la expongas en el frontend.
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, usuarioConRol } from '../_shared/auth.ts';

const ROLES = ['administrador', 'operador', 'consulta'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });
  try {
    if (req.method !== 'POST') throw new HttpError(405, 'Método no permitido');
    const { rol } = await usuarioConRol(req);
    if (rol !== 'administrador') throw new HttpError(403, 'Solo un administrador puede crear usuarios');

    const body = await req.json().catch(() => ({}));
    const email = String(body.email ?? '').trim().toLowerCase();
    const nombre = String(body.nombre_completo ?? '').trim();
    const rolNuevo = String(body.rol ?? 'consulta');
    const password = body.password ? String(body.password) : undefined;

    if (!EMAIL_RE.test(email)) throw new HttpError(400, 'Correo inválido');
    if (nombre.length < 3) throw new HttpError(400, 'Nombre requerido');
    if (!ROLES.includes(rolNuevo as (typeof ROLES)[number])) throw new HttpError(400, 'Rol inválido');
    if (password && password.length < 10) throw new HttpError(400, 'La contraseña debe tener al menos 10 caracteres');

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const metadata = { nombre_completo: nombre, rol: rolNuevo };

    // Con contraseña: crea el usuario confirmado. Sin contraseña: envía invitación por correo.
    const { data, error } = password
      ? await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: metadata })
      : await admin.auth.admin.inviteUserByEmail(email, { data: metadata });

    if (error) throw new HttpError(400, error.message);
    return json(req, { id: data.user?.id, email }, 201);
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    console.error(err);
    return json(req, { error: 'Error interno' }, 500);
  }
});
