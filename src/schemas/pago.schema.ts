import { z } from 'zod';

export const crearPagoSchema = (saldo: number) =>
  z
    .object({
      inscripcion_id: z.string().uuid(),
      monto: z.coerce
        .number({ invalid_type_error: 'Ingrese un monto' })
        .positive('Debe ser mayor a 0')
        .multipleOf(0.01, 'Máximo 2 decimales')
        .max(saldo, `No puede exceder el saldo pendiente`),
      fecha_pago: z.string().min(1, 'Requerido'),
      medio_pago: z.enum(['efectivo', 'yape', 'plin', 'transferencia', 'tarjeta']),
      numero_operacion: z.string().trim().max(50).optional().or(z.literal('')),
      observaciones: z.string().trim().max(500).optional().or(z.literal('')),
    })
    .refine((d) => d.medio_pago === 'efectivo' || !!d.numero_operacion, {
      path: ['numero_operacion'],
      message: 'Requerido para pagos electrónicos',
    });

export type PagoInput = z.infer<ReturnType<typeof crearPagoSchema>>;
