import type { RolCodigo } from '@/types/database';

/** Matriz de permisos del frontend. La seguridad real la aplica RLS en Supabase. */
export const PERMISOS = {
  'dashboard.ver':        ['administrador', 'operador', 'consulta'],
  'cursos.ver':           ['administrador', 'operador', 'consulta'],
  'cursos.gestionar':     ['administrador'],
  'estudiantes.ver':      ['administrador', 'operador', 'consulta'],
  'estudiantes.crear':    ['administrador', 'operador'],
  'estudiantes.gestionar':['administrador'],
  'inscripciones.ver':    ['administrador', 'operador', 'consulta'],
  'inscripciones.crear':  ['administrador', 'operador'],
  'inscripciones.anular': ['administrador'],
  'pagos.ver':            ['administrador', 'operador', 'consulta'],
  'pagos.crear':          ['administrador', 'operador'],
  'pagos.anular':         ['administrador'],
  'profesores.ver':       ['administrador', 'operador', 'consulta'],
  'profesores.gestionar': ['administrador'],
  'academico.ver':        ['administrador', 'operador', 'consulta'],
  // El operador solo registra en los cursos donde es tutor (lo exige RLS)
  'academico.registrar':  ['administrador', 'operador'],
  'reportes.ver':         ['administrador', 'consulta'],
  'usuarios.gestionar':   ['administrador'],
  'auditoria.ver':        ['administrador'],
  'configuracion.gestionar': ['administrador'],
} as const satisfies Record<string, readonly RolCodigo[]>;

export type Permiso = keyof typeof PERMISOS;

export function puede(rol: RolCodigo | null | undefined, permiso: Permiso): boolean {
  return !!rol && (PERMISOS[permiso] as readonly RolCodigo[]).includes(rol);
}
