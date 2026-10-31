// Formatos regionales para Perú (es-PE, PEN, America/Lima)
const LOCALE = 'es-PE';
export const TIMEZONE = 'America/Lima';

const moneda = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: 'PEN', minimumFractionDigits: 2 });
const numero = new Intl.NumberFormat(LOCALE);
const fecha = new Intl.DateTimeFormat(LOCALE, { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
const fechaLarga = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fechaHora = new Intl.DateTimeFormat(LOCALE, {
  day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
});
const mes = new Intl.DateTimeFormat(LOCALE, { month: 'short', year: 'numeric', timeZone: 'UTC' });

/** S/ 1,250.00 */
export const formatMoneda = (v: number | string | null | undefined) => moneda.format(Number(v ?? 0));
export const formatNumero = (v: number | string | null | undefined) => numero.format(Number(v ?? 0));

/** Las columnas DATE llegan como 'YYYY-MM-DD'; se interpretan en UTC para no correr un día. */
const parseFecha = (v: string) => new Date(v.length === 10 ? `${v}T00:00:00Z` : v);

/** Una fecha inválida haría lanzar a Intl ("date value is not finite"): se devuelve '—'. */
const seguro = (f: Intl.DateTimeFormat, d: Date) => (Number.isNaN(d.getTime()) ? '—' : f.format(d));

/** 16/10/2026 */
export const formatFecha = (v: string | null | undefined) => (v ? seguro(fecha, parseFecha(v)) : '—');
/** 16 de octubre de 2026 */
export const formatFechaLarga = (v: string | null | undefined) => (v ? seguro(fechaLarga, parseFecha(v)) : '—');
/** 16/10/2026 08:30 p. m. (hora de Lima) */
export const formatFechaHora = (v: string | null | undefined) => (v ? seguro(fechaHora, new Date(v)) : '—');
/** oct. 2026 */
export const formatMes = (v: string) => seguro(mes, parseFecha(v.slice(0, 10)));

/** Fecha de hoy en Lima como 'YYYY-MM-DD' (para inputs type=date). */
export function hoyISO(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TIMEZONE }).format(new Date());
}

export const nombreCompleto = (e: { nombres: string; apellido_paterno: string; apellido_materno?: string | null }) =>
  [e.nombres, e.apellido_paterno, e.apellido_materno].filter(Boolean).join(' ');
