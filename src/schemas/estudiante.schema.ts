import { z } from 'zod';

const vacioANull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

// Celular peruano (9 dígitos que empiezan en 9, opcional +51) o fijo (7-8 dígitos)
export const TELEFONO_RE = /^(\+?51)?9\d{8}$|^0?[1-8]\d{6,7}$/;

export const estudianteSchema = z.object({
  dni: z.string().trim().regex(/^\d{8}$/, 'El DNI debe tener 8 dígitos'),
  nombres: z.string().trim().min(2, 'Requerido').max(100),
  apellido_paterno: z.string().trim().min(2, 'Requerido').max(80),
  apellido_materno: z.string().trim().max(80),
  correo: z.preprocess(vacioANull, z.string().trim().toLowerCase().email('Correo inválido').max(150).nullable()),
  telefono: z.preprocess(
    (v) => (typeof v === 'string' ? vacioANull(v.replace(/[\s-]/g, '')) : v),
    z.string().regex(TELEFONO_RE, 'Teléfono inválido (ej. 987654321)').nullable(),
  ),
  direccion: z.preprocess(vacioANull, z.string().trim().max(250).nullable()),
  fecha_nacimiento: z.preprocess(
    vacioANull,
    z
      .string()
      .nullable()
      .refine((v) => !v || (v >= '1900-01-01' && v <= new Date().toISOString().slice(0, 10)), 'Fecha inválida'),
  ),
  estado: z.enum(['activo', 'inactivo']),
});

export type EstudianteInput = z.infer<typeof estudianteSchema>;
