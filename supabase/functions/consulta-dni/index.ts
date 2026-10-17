// Edge Function: consulta-dni
// Consulta en cascada para ahorrar el cupo de la API de pago:
//   1. scrall.net (gratuita, sin token)
//   2. apisperu.com (100 consultas/mes) solo si la primera no devuelve datos
// - El token APISPERU_TOKEN vive solo en el servidor (supabase secrets set APISPERU_TOKEN=...)
// - Solo usuarios autenticados con rol administrador u operador pueden consultar
// - Respuesta normalizada: { dni, nombres, apellidoPaterno, apellidoMaterno, fechaNacimiento, fuente }
import { corsHeaders, json } from '../_shared/cors.ts';
import { HttpError, usuarioConRol } from '../_shared/auth.ts';

const SCRALL_URL = 'https://api.scrall.net/v1/reniec/basico';
const APISPERU_URL = 'https://dniruc.apisperu.com/api/v1/dni';

interface DatosDni {
  dni: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
  fechaNacimiento: string | null; // YYYY-MM-DD
  fuente: 'scrall' | 'apisperu';
}

const limpio = (v: unknown) => String(v ?? '').trim();

function fetchConTimeout(url: string, init: RequestInit, ms: number) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timeout));
}

/** API gratuita. Nunca lanza: ante cualquier fallo devuelve null para pasar a la siguiente. */
async function consultarScrall(dni: string): Promise<DatosDni | null> {
  try {
    const resp = await fetchConTimeout(SCRALL_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ dni }),
    }, 6000);
    if (!resp.ok) {
      console.warn(`scrall ${resp.status}:`, (await resp.text().catch(() => '')).slice(0, 300));
      return null;
    }
    const r = (await resp.json())?.result;
    if (!limpio(r?.D_PRENOMBRES) || !limpio(r?.D_APEPATERNO)) return null;

    // D_FENACIMIENTO llega como DD/MM/YYYY
    const f = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(limpio(r.D_FENACIMIENTO));
    return {
      dni: limpio(r.D_NUDNI) || dni,
      nombres: limpio(r.D_PRENOMBRES),
      apellidoPaterno: limpio(r.D_APEPATERNO),
      apellidoMaterno: limpio(r.D_APEMATERNO),
      fechaNacimiento: f ? `${f[3]}-${f[2]}-${f[1]}` : null,
      fuente: 'scrall',
    };
  } catch (err) {
    console.warn('scrall no disponible:', err instanceof Error ? err.message : err);
    return null;
  }
}

/** API con token y cupo mensual. Lanza HttpError con el motivo si falla. */
async function consultarApisperu(dni: string): Promise<DatosDni> {
  // Tolera que el secreto se haya guardado con el prefijo "Bearer " o con espacios
  const token = Deno.env.get('APISPERU_TOKEN')?.trim().replace(/^Bearer\s+/i, '');
  if (!token) throw new HttpError(500, 'APISPERU_TOKEN no configurado en el servidor');

  const resp = await fetchConTimeout(`${APISPERU_URL}/${dni}`, {
    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
  }, 8000);

  if (!resp.ok) {
    console.error(`apisperu ${resp.status}:`, (await resp.text().catch(() => '')).slice(0, 300));
    if (resp.status === 401 || resp.status === 403) {
      throw new HttpError(502, `Token de API DNI inválido (apisperu respondió ${resp.status})`);
    }
    throw new HttpError(502, `El servicio de DNI respondió ${resp.status}`);
  }

  const data = await resp.json();
  // apisperu devuelve { success: false, message } cuando no encuentra el DNI
  if (data?.success === false || !data?.nombres) throw new HttpError(404, data?.message ?? 'DNI no encontrado');

  return {
    dni: data.dni ?? dni,
    nombres: limpio(data.nombres),
    apellidoPaterno: limpio(data.apellidoPaterno),
    apellidoMaterno: limpio(data.apellidoMaterno),
    fechaNacimiento: null,
    fuente: 'apisperu',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders(req) });

  try {
    const { rol } = await usuarioConRol(req);
    if (rol !== 'administrador' && rol !== 'operador') throw new HttpError(403, 'Sin permiso para consultar DNI');

    const url = new URL(req.url);
    let dni = url.searchParams.get('dni');
    if (!dni && req.method === 'POST') dni = (await req.json().catch(() => ({})))?.dni;
    dni = String(dni ?? '').trim();
    if (!/^\d{8}$/.test(dni)) throw new HttpError(400, 'El DNI debe tener 8 dígitos');

    const datos = (await consultarScrall(dni)) ?? (await consultarApisperu(dni));
    console.log(`DNI ${dni.slice(0, 2)}****** resuelto por ${datos.fuente}`);
    return json(req, datos);
  } catch (err) {
    if (err instanceof HttpError) return json(req, { error: err.message }, err.status);
    if (err instanceof DOMException && err.name === 'AbortError') return json(req, { error: 'Tiempo de espera agotado' }, 504);
    console.error(err);
    return json(req, { error: 'Error interno' }, 500);
  }
});
