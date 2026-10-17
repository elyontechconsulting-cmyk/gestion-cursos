import { z } from 'zod';

export const inscripcionSchema = z.object({
  estudiante_id: z.string().uuid('Seleccione un estudiante'),
  curso_id: z.string().uuid('Seleccione un curso'),
  fecha_inscripcion: z.string().min(1, 'Requerido'),
  estado: z.enum(['preinscrito', 'inscrito', 'retirado', 'finalizado']),
  observacion: z.string().trim().max(500).optional().or(z.literal('')),
});

export type InscripcionInput = z.infer<typeof inscripcionSchema>;
