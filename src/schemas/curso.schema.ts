import { z } from 'zod';

export const cursoSchema = z
  .object({
    codigo: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^[A-Z0-9-]{2,20}$/, 'Use de 2 a 20 caracteres: letras, números o guiones'),
    nombre: z.string().trim().min(3, 'Mínimo 3 caracteres').max(150),
    descripcion: z.string().trim().max(2000).optional().or(z.literal('')),
    fecha_inicio: z.string().min(1, 'Requerido'),
    fecha_fin: z.string().min(1, 'Requerido'),
    horario: z.string().trim().max(120).optional().or(z.literal('')),
    modalidad: z.enum(['presencial', 'virtual', 'hibrido']),
    costo: z.coerce.number({ invalid_type_error: 'Ingrese un monto' }).min(0, 'No puede ser negativo').max(999999),
    cupos: z.coerce.number({ invalid_type_error: 'Ingrese un número' }).int('Debe ser entero').min(1, 'Mínimo 1').max(10000),
    estado: z.enum(['programado', 'en_ejecucion', 'finalizado', 'cancelado']),
    // Gestión académica
    tutor_id: z.string().optional().or(z.literal('')),
    profesor_ids: z.array(z.string()),
    numero_sesiones: z.coerce.number({ invalid_type_error: 'Ingrese un número' }).int('Debe ser entero').min(1, 'Mínimo 1').max(60),
    faltas_maximas: z.coerce.number({ invalid_type_error: 'Ingrese un número' }).int('Debe ser entero').min(1, 'Mínimo 1').max(60),
    nota_aprobatoria: z.coerce.number({ invalid_type_error: 'Ingrese una nota' }).min(0, 'Entre 0 y 20').max(20, 'Entre 0 y 20'),
  })
  .refine((d) => d.faltas_maximas <= d.numero_sesiones, {
    path: ['faltas_maximas'],
    message: 'No puede superar el número de sesiones',
  })
  .refine((d) => !d.fecha_inicio || !d.fecha_fin || d.fecha_fin >= d.fecha_inicio, {
    path: ['fecha_fin'],
    message: 'Debe ser igual o posterior a la fecha de inicio',
  });

export type CursoInput = z.infer<typeof cursoSchema>;
