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
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface CursoResumen extends Curso {
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
