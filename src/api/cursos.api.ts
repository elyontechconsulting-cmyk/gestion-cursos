import { supabase } from '@/lib/supabase';
import type { Curso, CursoResumen, EstadoCurso, Modalidad } from '@/types/database';
import type { PageParams, Paginated } from '@/types/common';
import type { CursoInput } from '@/schemas/curso.schema';
import { limpiar, rango, textoBusqueda, unwrap, unwrapPage } from './helpers';

export interface CursoFiltros extends PageParams {
  tutorId?: string;
  estado?: EstadoCurso | '';
  modalidad?: Modalidad | '';
  desde?: string;
  hasta?: string;
}

export const cursosApi = {
  async listar(f: CursoFiltros): Promise<Paginated<CursoResumen>> {
    let q = supabase.from('v_cursos_resumen').select('*', { count: 'exact' });
    const t = textoBusqueda(f.search);
    if (t) q = q.or(`nombre.ilike.%${t}%,codigo.ilike.%${t}%`);
    if (f.estado) q = q.eq('estado', f.estado);
    if (f.modalidad) q = q.eq('modalidad', f.modalidad);
    if (f.tutorId) q = q.eq('tutor_id', f.tutorId);
    if (f.desde) q = q.gte('fecha_inicio', f.desde);
    if (f.hasta) q = q.lte('fecha_inicio', f.hasta);
    return unwrapPage(await q.order('codigo').range(...rango(f)));
  },

  /** Lista ligera para selects (cursos que aceptan inscripciones). */
  async opciones(soloAbiertos = true) {
    let q = supabase
      .from('v_cursos_resumen')
      .select('id, codigo, nombre, costo, cupos, cupos_disponibles, estado, fecha_inicio')
      .order('fecha_inicio', { ascending: false });
    if (soloAbiertos) q = q.in('estado', ['programado', 'en_ejecucion']);
    return unwrap(await q) as Pick<
      CursoResumen,
      'id' | 'codigo' | 'nombre' | 'costo' | 'cupos' | 'cupos_disponibles' | 'estado' | 'fecha_inicio'
    >[];
  },

  async obtener(id: string): Promise<CursoResumen> {
    return unwrap(await supabase.from('v_cursos_resumen').select('*').eq('id', id).single());
  },

  async crear({ profesor_ids, ...input }: CursoInput): Promise<Curso> {
    const curso: Curso = unwrap(await supabase.from('cursos').insert(limpiar(input)).select().single());
    await cursosApi.guardarProfesores(curso.id, profesor_ids);
    return curso;
  },

  async actualizar(id: string, { profesor_ids, ...input }: CursoInput): Promise<Curso> {
    const curso: Curso = unwrap(await supabase.from('cursos').update(limpiar(input)).eq('id', id).select().single());
    await cursosApi.guardarProfesores(id, profesor_ids);
    return curso;
  },

  async guardarProfesores(cursoId: string, profesorIds: string[]): Promise<void> {
    unwrap(await supabase.rpc('fn_guardar_profesores_curso', { p_curso: cursoId, p_profesores: profesorIds }));
  },

  /** Soft delete: marca deleted_at; el trigger de auditoría lo registra como DELETE. */
  async eliminar(id: string): Promise<void> {
    const { count } = await supabase
      .from('inscripciones')
      .select('id', { count: 'exact', head: true })
      .eq('curso_id', id)
      .is('deleted_at', null);
    if (count && count > 0) throw new Error(`El curso tiene ${count} inscripción(es). Cancélelo en lugar de eliminarlo.`);
    unwrap(await supabase.from('cursos').update({ deleted_at: new Date().toISOString() }).eq('id', id));
  },

  async duplicar(id: string): Promise<Curso> {
    const original: CursoResumen = unwrap(await supabase.from('v_cursos_resumen').select('*').eq('id', id).single());
    const base = original.codigo.replace(/-C\d+$/, '').slice(0, 15);
    let codigo = `${base}-C1`;
    for (let i = 1; i < 50; i++) {
      codigo = `${base}-C${i}`;
      const { count } = await supabase
        .from('cursos')
        .select('id', { count: 'exact', head: true })
        .eq('codigo', codigo)
        .is('deleted_at', null);
      if (!count) break;
    }
    const copia = {
      codigo,
      nombre: `${original.nombre} (copia)`.slice(0, 150),
      descripcion: original.descripcion,
      fecha_inicio: original.fecha_inicio,
      fecha_fin: original.fecha_fin,
      horario: original.horario,
      modalidad: original.modalidad,
      costo: original.costo,
      cupos: original.cupos,
      estado: 'programado' as const,
      tutor_id: original.tutor_id,
      numero_sesiones: original.numero_sesiones,
      faltas_maximas: original.faltas_maximas,
      nota_aprobatoria: original.nota_aprobatoria,
    };
    const curso: Curso = unwrap(await supabase.from('cursos').insert(copia).select().single());
    if (original.profesor_ids.length) await cursosApi.guardarProfesores(curso.id, original.profesor_ids);
    return curso;
  },
};
