// Tipos del dominio, alineados con supabase/migrations/*.sql
// Puedes regenerarlos con: npx supabase gen types typescript --project-id <id> > src/types/supabase.ts

export type RolCodigo = 'administrador' | 'operador' | 'consulta';
export type Modalidad = 'presencial' | 'virtual' | 'hibrido';
export type EstadoCurso = 'programado' | 'en_ejecucion' | 'finalizado' | 'cancelado';
export type EstadoRegistro = 'activo' | 'inactivo';
export type EstadoInscripcion = 'preinscrito' | 'inscrito' | 'retirado' | 'finalizado';
export type MedioPago = 'efectivo' | 'yape' | 'plin' | 'transferencia' | 'tarjeta';
export type EstadoPago = 'pendiente' | 'parcial' | 'pagado';
export type AccionAuditoria = 'INSERT' | 'UPDATE' | 'DELETE';
export type EstadoAcademico = 'en_curso' | 'aprobado' | 'desaprobado' | 'desaprobado_faltas' | 'retirado';

export interface Rol {
  id: number;
  codigo: RolCodigo;
  nombre: string;
  descripcion: string | null;
}

export interface Usuario {
  id: string;
  email: string;
  nombre_completo: string;
  rol_id: number;
  activo: boolean;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  roles?: Pick<Rol, 'codigo' | 'nombre'> | null;
}

export interface Curso {
  id: string;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  fecha_inicio: string;
  fecha_fin: string;
  horario: string | null;
  modalidad: Modalidad;
  costo: number;
  cupos: number;
  estado: EstadoCurso;
  tutor_id: string | null;
  numero_sesiones: number;
  faltas_maximas: number;
  nota_aprobatoria: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CursoResumen extends Curso {
  tutor_nombre: string | null;
  tutor_email: string | null;
  profesores: string | null;
  profesor_ids: string[];
  inscritos: number;
  cupos_disponibles: number;
  pagados: number;
  pendientes: number;
  recaudado: number;
  por_cobrar: number;
}

export interface Estudiante {
  id: string;
  dni: string;
  nombres: string;
  apellido_paterno: string;
  apellido_materno: string;
  correo: string | null;
  telefono: string | null;
  direccion: string | null;
  fecha_nacimiento: string | null;
  estado: EstadoRegistro;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface Profesor {
  id: string;
  dni: string | null;
  nombres: string;
  apellidos: string;
  telefono: string | null;
  correo: string | null;
  especialidad: string | null;
  estado: EstadoRegistro;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** Usuario que puede ser tutor de un curso (administrador u operador). */
export interface Personal {
  id: string;
  nombre_completo: string;
  email: string;
  rol: RolCodigo;
}

export interface Inscripcion {
  id: string;
  estudiante_id: string;
  curso_id: string;
  fecha_inscripcion: string;
  estado: EstadoInscripcion;
  observacion: string | null;
  monto_total: number;
  created_at: string;
}

export interface InscripcionDetalle extends Inscripcion {
  dni: string;
  estudiante_nombre: string;
  estudiante_correo: string | null;
  estudiante_telefono: string | null;
  curso_codigo: string;
  curso_nombre: string;
  curso_fecha_inicio: string;
  curso_estado: EstadoCurso;
  total_pagado: number;
  saldo_pendiente: number;
  estado_pago: EstadoPago;
  ultimo_pago: string | null;
}

export interface Pago {
  id: string;
  inscripcion_id: string;
  monto: number;
  fecha_pago: string;
  medio_pago: MedioPago;
  numero_operacion: string | null;
  observaciones: string | null;
  created_at: string;
  numero_recibo: number;
}

export interface PagoDetalle extends Pago {
  curso_id: string;
  estudiante_id: string;
  dni: string;
  estudiante_nombre: string;
  curso_codigo: string;
  curso_nombre: string;
  registrado_por: string | null;
  inscripcion_monto_total: number;
}

export interface Asistencia {
  id: string;
  inscripcion_id: string;
  sesion: number;
  asistio: boolean;
  devocional: boolean;
  interseccion: boolean;
  servicio: boolean;
}

/** Fila de v_notas: resumen académico y promedio final de una inscripción. */
export interface NotaDetalle {
  inscripcion_id: string;
  curso_id: string;
  estudiante_id: string;
  inscripcion_estado: EstadoInscripcion;
  dni: string;
  estudiante_nombre: string;
  numero_sesiones: number;
  faltas_maximas: number;
  nota_aprobatoria: number;
  sesiones_registradas: number;
  asistencias: number;
  faltas: number;
  devocionales: number;
  intersecciones: number;
  servicios: number;
  nota_asistencia: number;
  nota_devocional: number;
  nota_interseccion: number;
  nota_servicio: number;
  nota_trabajo: number | null;
  nota_examen: number | null;
  observacion: string | null;
  promedio: number;
  notas_completas: boolean;
  estado_academico: EstadoAcademico;
}

export interface Configuracion {
  id: number;
  nombre_organizacion: string;
  ruc: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  updated_at: string;
}

export interface Auditoria {
  id: number;
  usuario_id: string | null;
  usuario_email: string | null;
  accion: AccionAuditoria;
  tabla: string;
  registro_id: string;
  datos_anteriores: Record<string, unknown> | null;
  datos_nuevos: Record<string, unknown> | null;
  fecha: string;
}

export interface DashboardResumen {
  total_cursos: number;
  cursos_activos: number;
  total_estudiantes: number;
  total_inscritos: number;
  total_recaudado: number;
  pagos_pendientes: number;
  monto_por_cobrar: number;
}

export interface RecaudacionMensual {
  mes: string;
  total: number;
  cantidad: number;
}
