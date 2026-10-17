import { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { inscripcionSchema, type InscripcionInput } from '@/schemas/inscripcion.schema';
import { useCrearInscripcion } from '@/hooks/useInscripciones';
import { useCursosOpciones } from '@/hooks/useCursos';
import { inscripcionesApi } from '@/api/inscripciones.api';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { EstudianteCombobox } from '@/components/forms/EstudianteCombobox';
import { EstudianteFormModal } from '@/pages/estudiantes/EstudianteFormModal';
import { PagoFormModal } from '@/pages/pagos/PagoFormModal';
import { usePermisos } from '@/hooks/usePermisos';
import { ESTADOS_INSCRIPCION } from '@/lib/constants';
import { formatMoneda, hoyISO } from '@/utils/format';
import { notify } from '@/services/notify';
import type { Estudiante, InscripcionDetalle } from '@/types/database';

export function InscripcionFormModal({ open, onClose, cursoId }: { open: boolean; onClose: () => void; cursoId?: string }) {
  const crear = useCrearInscripcion();
  const { puede } = usePermisos();
  const { data: cursos = [] } = useCursosOpciones(true);
  const [estudiante, setEstudiante] = useState<Estudiante | null>(null);
  const [nuevoEst, setNuevoEst] = useState(false);
  const [pagar, setPagar] = useState<InscripcionDetalle | null>(null);

  const { register, handleSubmit, reset, control, watch, setValue, formState: { errors, isSubmitting } } = useForm<InscripcionInput>({
    resolver: zodResolver(inscripcionSchema),
  });

  useEffect(() => {
    if (!open) return;
    setEstudiante(null);
    reset({ estudiante_id: '', curso_id: cursoId ?? '', fecha_inscripcion: hoyISO(), estado: 'inscrito', observacion: '' });
  }, [open, cursoId, reset]);

  const cursoSel = cursos.find((c) => c.id === watch('curso_id'));

  const onSubmit = async (input: InscripcionInput) => {
    try {
      const ins = await crear.mutateAsync(input);
      onClose();
      if (puede('pagos.crear') && Number(ins.monto_total) > 0) {
        const pagarAhora = await notify.confirm({
          title: 'Inscripción registrada',
          text: `Monto del curso: ${formatMoneda(ins.monto_total)}. ¿Desea registrar un pago ahora?`,
          confirmText: 'Registrar pago',
        });
        if (pagarAhora) setPagar(await inscripcionesApi.obtener(ins.id));
      } else {
        notify.success('Inscripción registrada');
      }
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        title="Nueva inscripción"
        size="lg"
        footer={
          <>
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button type="submit" form="form-inscripcion" loading={isSubmitting}>Inscribir</Button>
          </>
        }
      >
        <form id="form-inscripcion" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Estudiante" required error={errors.estudiante_id?.message} className="sm:col-span-2">
            <Controller
              control={control}
              name="estudiante_id"
              render={({ field }) => (
                <EstudianteCombobox
                  value={estudiante}
                  invalid={!!errors.estudiante_id}
                  onChange={(e) => { setEstudiante(e); field.onChange(e?.id ?? ''); }}
                  onNuevo={puede('estudiantes.crear') ? () => setNuevoEst(true) : undefined}
                />
              )}
            />
          </Field>
          <Field
            label="Curso" required error={errors.curso_id?.message} className="sm:col-span-2"
            hint={cursoSel && `Costo: ${formatMoneda(cursoSel.costo)} · Cupos disponibles: ${cursoSel.cupos_disponibles} de ${cursoSel.cupos}`}
          >
            <Select invalid={!!errors.curso_id} disabled={!!cursoId} {...register('curso_id')}>
              <option value="">Seleccione un curso…</option>
              {cursos.map((c) => (
                <option key={c.id} value={c.id} disabled={c.cupos_disponibles <= 0}>
                  {c.codigo} · {c.nombre} {c.cupos_disponibles <= 0 ? '(sin cupos)' : `(${c.cupos_disponibles} cupos)`}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Fecha de inscripción" required error={errors.fecha_inscripcion?.message}>
            <Input type="date" {...register('fecha_inscripcion')} />
          </Field>
          <Field label="Estado" required>
            <Select {...register('estado')}>
              {(['preinscrito', 'inscrito'] as const).map((v) => <option key={v} value={v}>{ESTADOS_INSCRIPCION[v]}</option>)}
            </Select>
          </Field>
          <Field label="Observación" className="sm:col-span-2">
            <Textarea {...register('observacion')} />
          </Field>
        </form>
      </Modal>
      <EstudianteFormModal
        open={nuevoEst}
        onClose={() => setNuevoEst(false)}
        onCreado={(e) => { setEstudiante(e); setValue('estudiante_id', e.id, { shouldValidate: true }); }}
      />
      <PagoFormModal inscripcion={pagar} onClose={() => setPagar(null)} />
    </>
  );
}
