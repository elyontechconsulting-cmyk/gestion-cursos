import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { crearPagoSchema, type PagoInput } from '@/schemas/pago.schema';
import { useHistorialPagos, useRegistrarPago } from '@/hooks/usePagos';
import { Printer } from 'lucide-react';
import { Button, Field, IconAction, Input, Modal, Select, Textarea } from '@/components/ui';
import { MEDIOS_PAGO, toOptions } from '@/lib/constants';
import { formatFecha, formatMoneda, hoyISO } from '@/utils/format';
import { notify } from '@/services/notify';
import { formatNumeroRecibo, reimprimir } from '@/services/recibo.service';
import type { InscripcionDetalle } from '@/types/database';

/** Registro de pago total o parcial con cálculo automático de saldo. */
export function PagoFormModal({ inscripcion, onClose }: { inscripcion: InscripcionDetalle | null; onClose: () => void }) {
  const registrar = useRegistrarPago();
  const { data: historial = [], isSuccess } = useHistorialPagos(inscripcion?.id);

  const total = Number(inscripcion?.monto_total ?? 0);
  // Mientras carga el historial se usa el total pagado de la vista; luego, el cálculo fresco
  const pagado = isSuccess ? historial.reduce((s, p) => s + Number(p.monto), 0) : Number(inscripcion?.total_pagado ?? 0);
  const saldo = Math.max(0, Math.round((total - pagado) * 100) / 100);

  const schema = useMemo(() => crearPagoSchema(saldo), [saldo]);
  const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm<PagoInput>({ resolver: zodResolver(schema) });

  useEffect(() => {
    if (!inscripcion) return;
    reset({
      inscripcion_id: inscripcion.id,
      monto: Number(inscripcion.saldo_pendiente),
      fecha_pago: hoyISO(),
      medio_pago: 'efectivo',
      numero_operacion: '',
      observaciones: '',
    });
  }, [inscripcion, reset]);

  const medio = watch('medio_pago');
  const monto = Number(watch('monto') || 0);
  const saldoTras = Math.max(0, saldo - monto);

  const onSubmit = async (input: PagoInput) => {
    let pago;
    try {
      pago = await registrar.mutateAsync(input);
    } catch (e) {
      notify.error(e);
      return;
    }
    onClose();
    const imprimir = await notify.confirm({
      title: input.monto >= saldo ? 'Pago total registrado' : 'Pago parcial registrado',
      text: `Recibo N.° ${formatNumeroRecibo(pago.numero_recibo)} · Saldo pendiente: ${formatMoneda(saldo - input.monto)}`,
      confirmText: 'Imprimir recibo',
      cancelText: 'Cerrar',
      icon: 'success',
    });
    if (imprimir) await reimprimir(pago.id, pago.inscripcion_id, false);
  };

  return (
    <Modal
      open={!!inscripcion}
      onClose={onClose}
      title="Registrar pago"
      description={inscripcion ? `${inscripcion.estudiante_nombre} · ${inscripcion.curso_nombre}` : ''}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-pago" loading={isSubmitting} disabled={saldo <= 0}>Registrar pago</Button>
        </>
      }
    >
      {/* Resumen: Total (-) Pagos = Saldo */}
      <div className="mb-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4 font-mono text-sm dark:border-white/10 dark:bg-white/[0.03]">
        <div className="flex justify-between"><span className="text-zinc-500">Total del curso</span><span>{formatMoneda(total)}</span></div>
        <div className="flex justify-between"><span className="text-zinc-500">(−) Pagos registrados</span><span>{formatMoneda(pagado)}</span></div>
        <div className="my-2 border-t border-dashed border-zinc-300 dark:border-white/15" />
        <div className="flex justify-between text-base font-semibold"><span>Saldo pendiente</span><span className={saldo > 0 ? 'text-red-600 dark:text-red-400' : 'text-emerald-600'}>{formatMoneda(saldo)}</span></div>
      </div>

      {saldo > 0 ? (
        <form id="form-pago" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <input type="hidden" {...register('inscripcion_id')} />
          <Field label="Monto (S/)" required error={errors.monto?.message} hint={monto > 0 && monto < saldo ? `Pago parcial · quedará ${formatMoneda(saldoTras)}` : monto === saldo ? 'Pago total' : undefined}>
            <div className="flex gap-2">
              <Input type="number" step="0.01" min="0.01" max={saldo} inputMode="decimal" invalid={!!errors.monto} {...register('monto')} />
              <Button variant="secondary" onClick={() => setValue('monto', saldo, { shouldValidate: true })}>Total</Button>
            </div>
          </Field>
          <Field label="Fecha de pago" required error={errors.fecha_pago?.message}>
            <Input type="date" max={hoyISO()} {...register('fecha_pago')} />
          </Field>
          <Field label="Medio de pago" required>
            <Select {...register('medio_pago')}>
              {toOptions(MEDIOS_PAGO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>
          </Field>
          <Field label="N.° de operación" required={medio !== 'efectivo'} error={errors.numero_operacion?.message}>
            <Input autoComplete="off" disabled={medio === 'efectivo'} invalid={!!errors.numero_operacion} {...register('numero_operacion')} />
          </Field>
          <Field label="Observaciones" className="sm:col-span-2">
            <Textarea rows={2} {...register('observaciones')} />
          </Field>
        </form>
      ) : (
        <p className="text-center text-sm text-emerald-600">Esta inscripción ya está totalmente pagada.</p>
      )}

      {historial.length > 0 && (
        <div className="mt-6">
          <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">Historial de pagos</h4>
          <ul className="divide-y divide-zinc-100 rounded-lg border border-zinc-200 text-sm dark:divide-white/[0.06] dark:border-white/10">
            {historial.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-3 py-2">
                <span>
                  <span className="font-mono text-xs text-zinc-500">N.° {formatNumeroRecibo(p.numero_recibo)}</span>{' '}
                  · {formatFecha(p.fecha_pago)} · {MEDIOS_PAGO[p.medio_pago]}{p.numero_operacion ? ` #${p.numero_operacion}` : ''}
                </span>
                <span className="flex items-center gap-1">
                  <span className="font-medium">{formatMoneda(p.monto)}</span>
                  <IconAction label="Reimprimir recibo" onClick={() => reimprimir(p.id, p.inscripcion_id)}>
                    <Printer className="h-4 w-4" />
                  </IconAction>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Modal>
  );
}
