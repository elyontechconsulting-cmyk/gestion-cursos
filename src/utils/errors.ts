import type { PostgrestError } from '@supabase/supabase-js';

/** Traduce errores de PostgREST/PostgreSQL a mensajes comprensibles para el usuario. */
export function mensajeError(err: unknown): string {
  if (!err) return 'Ocurrió un error inesperado';
  const e = err as Partial<PostgrestError> & { message?: string; status?: number };
  const msg = e.message ?? String(err);

  if (e.code === '23505') {
    if (msg.includes('uq_estudiantes_dni')) return 'Ya existe un estudiante con ese DNI';
    if (msg.includes('uq_estudiantes_correo')) return 'Ya existe un estudiante con ese correo';
    if (msg.includes('uq_cursos_codigo')) return 'Ya existe un curso con ese código';
    if (msg.includes('uq_inscripcion')) return 'El estudiante ya está inscrito en este curso';
    if (msg.includes('uq_pagos_operacion')) return 'Ese número de operación ya fue registrado';
    return 'El registro ya existe';
  }
  if (e.code === '23514') {
    if (msg.includes('ck_pagos_operacion')) return 'Ingrese el número de operación para pagos electrónicos';
    if (msg.includes('ck_estudiantes_telefono')) return 'Teléfono inválido';
    if (msg.includes('ck_estudiantes_correo')) return 'Correo inválido';
    if (msg.includes('ck_cursos_fechas')) return 'La fecha de fin debe ser posterior a la de inicio';
    return 'Los datos no cumplen las reglas de validación';
  }
  if (e.code === '23503') return 'El registro está relacionado con otros datos y no puede modificarse';
  if (e.code === '42501' || msg.includes('row-level security')) return 'No tiene permisos para realizar esta acción';
  if (e.code === 'P0001') return msg; // mensajes de negocio lanzados por triggers
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Sin conexión con el servidor';
  if (msg === 'Invalid login credentials') return 'Correo o contraseña incorrectos';
  return msg;
}
