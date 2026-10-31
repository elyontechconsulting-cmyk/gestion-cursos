import { z } from 'zod';
import { TELEFONO_RE } from './estudiante.schema';

const vacioANull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

export const profesorSchema = z.object({
  dni: z.preprocess(vacioANull, z.string().trim().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos').nullable()),
  nombres: z.string().trim().min(2, 'Requerido').max(100),
  apellidos: z.string().trim().min(2, 'Requerido').max(150),
  telefono: z.preprocess(
    (v) => (typeof v === 'string' ? vacioANull(v.replace(/[\s-]/g, '')) : v),
    z.string().regex(TELEFONO_RE, 'Teléfono inválido (ej. 987654321)').nullable(),
  ),
  correo: z.preprocess(vacioANull, z.string().trim().toLowerCase().email('Correo inválido').max(150).nullable()),
  especialidad: z.preprocess(vacioANull, z.string().trim().max(150).nullable()),
  estado: z.enum(['activo', 'inactivo']),
});

export type ProfesorInput = z.infer<typeof profesorSchema>;
