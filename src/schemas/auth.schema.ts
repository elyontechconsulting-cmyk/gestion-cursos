import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().trim().email('Correo inválido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const recuperarSchema = z.object({ email: z.string().trim().email('Correo inválido') });
export type RecuperarInput = z.infer<typeof recuperarSchema>;

export const nuevaPasswordSchema = z
  .object({
    password: z
      .string()
      .min(10, 'Mínimo 10 caracteres')
      .regex(/[A-Z]/, 'Incluya una mayúscula')
      .regex(/[0-9]/, 'Incluya un número'),
    confirmar: z.string(),
  })
  .refine((d) => d.password === d.confirmar, { path: ['confirmar'], message: 'Las contraseñas no coinciden' });
export type NuevaPasswordInput = z.infer<typeof nuevaPasswordSchema>;

export const usuarioSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo inválido'),
  nombre_completo: z.string().trim().min(3, 'Requerido'),
  rol: z.enum(['administrador', 'operador', 'consulta']),
  password: z.string().min(10, 'Mínimo 10 caracteres').optional().or(z.literal('')),
});
export type UsuarioInput = z.infer<typeof usuarioSchema>;
