import { supabase } from '@/lib/supabase';
import type { Asistencia, NotaDetalle, Personal } from '@/types/database';
import { unwrap } from './helpers';

export type AsistenciaInput = Omit<Asistencia, 'id'>;

export interface CalificacionInput {
  inscripcion_id: string;
  nota_trabajo: number | null;
  nota_examen: number | null;
}

export const academicoApi = {
  /** Resumen académico y promedio final de cada inscrito del curso. */
  async notas(cursoId: string): Promise<NotaDetalle[]> {
    return unwrap(await supabase.from('v_notas').select('*').eq('curso_id', cursoId).order('estudiante_nombre'));
  },

  async asistencias(cursoId: string): Promise<Asistencia[]> {
    const filas: (Asistencia & { inscripciones?: unknown })[] = unwrap(
      await supabase
        .from('asistencias')
        .select('id, inscripcion_id, sesion, asistio, devocional, interseccion, servicio, inscripciones!inner(curso_id)')
        .eq('inscripciones.curso_id', cursoId),
    );
    return filas.map(({ inscripciones: _join, ...a }) => a);
  },

  /** Crea o actualiza el registro de una sesión para varios estudiantes. */
  async guardarSesion(filas: AsistenciaInput[]): Promise<void> {
    if (!filas.length) return;
    unwrap(await supabase.from('asistencias').upsert(filas, { onConflict: 'inscripcion_id,sesion' }));
  },

  async guardarCalificaciones(filas: CalificacionInput[]): Promise<void> {
    if (!filas.length) return;
    unwrap(await supabase.from('calificaciones').upsert(filas, { onConflict: 'inscripcion_id' }));
  },

  /** Usuarios que pueden ser tutores (operadores y administradores activos). */
  async personal(): Promise<Personal[]> {
    return unwrap(await supabase.from('v_personal').select('*').order('nombre_completo'));
  },
};
