import { z } from 'zod';

const vacioANull = (v: unknown) => (typeof v === 'string' && v.trim() === '' ? null : v);

export const configuracionSchema = z.object({
  nombre_organizacion: z.string().trim().min(2, 'Requerido').max(150),
  ruc: z.preprocess(vacioANull, z.string().trim().regex(/^\d{11}$/, 'El RUC debe tener 11 dígitos').nullable()),
  direccion: z.preprocess(vacioANull, z.string().trim().max(250).nullable()),
  telefono: z.preprocess(vacioANull, z.string().trim().max(30).nullable()),
  correo: z.preprocess(vacioANull, z.string().trim().toLowerCase().email('Correo inválido').max(150).nullable()),
});

export type ConfiguracionInput = z.infer<typeof configuracionSchema>;
