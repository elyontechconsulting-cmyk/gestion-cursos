import type {
  EstadoCurso, EstadoInscripcion, EstadoPago, EstadoRegistro, MedioPago, Modalidad, RolCodigo,
} from '@/types/database';

export const MODALIDADES: Record<Modalidad, string> = {
  presencial: 'Presencial',
  virtual: 'Virtual',
  hibrido: 'Híbrido',
};

export const ESTADOS_CURSO: Record<EstadoCurso, string> = {
  programado: 'Programado',
  en_ejecucion: 'En ejecución',
  finalizado: 'Finalizado',
  cancelado: 'Cancelado',
};

export const ESTADOS_REGISTRO: Record<EstadoRegistro, string> = { activo: 'Activo', inactivo: 'Inactivo' };

export const ESTADOS_INSCRIPCION: Record<EstadoInscripcion, string> = {
  preinscrito: 'Preinscrito',
  inscrito: 'Inscrito',
  retirado: 'Retirado',
  finalizado: 'Finalizado',
};

export const MEDIOS_PAGO: Record<MedioPago, string> = {
  efectivo: 'Efectivo',
  yape: 'Yape',
  plin: 'Plin',
  transferencia: 'Transferencia',
  tarjeta: 'Tarjeta',
};

export const ESTADOS_PAGO: Record<EstadoPago, string> = { pendiente: 'Pendiente', parcial: 'Parcial', pagado: 'Pagado' };

export const ROLES: Record<RolCodigo, string> = {
  administrador: 'Administrador',
  operador: 'Operador',
  consulta: 'Consulta',
};

export type Tono = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet';

export const TONO_ESTADO: Record<string, Tono> = {
  programado: 'blue', en_ejecucion: 'green', finalizado: 'gray', cancelado: 'red',
  activo: 'green', inactivo: 'gray',
  preinscrito: 'amber', inscrito: 'blue', retirado: 'red',
  pendiente: 'red', parcial: 'amber', pagado: 'green',
  administrador: 'violet', operador: 'blue', consulta: 'gray',
};

export const toOptions = <K extends string>(rec: Record<K, string>) =>
  (Object.entries(rec) as [K, string][]).map(([value, label]) => ({ value, label }));

export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];
