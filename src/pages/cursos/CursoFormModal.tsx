import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cursoSchema, type CursoInput } from '@/schemas/curso.schema';
import { useGuardarCurso } from '@/hooks/useCursos';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { ESTADOS_CURSO, MODALIDADES, toOptions } from '@/lib/constants';
import { notify } from '@/services/notify';
import { hoyISO } from '@/utils/format';
import { sumarDias } from '@/utils/date';
import type { Curso } from '@/types/database';

const vacio = (): CursoInput => ({
  codigo: '', nombre: '', descripcion: '', fecha_inicio: hoyISO(), fecha_fin: sumarDias(hoyISO(), 30),
  horario: '', modalidad: 'presencial', costo: 0, cupos: 20, estado: 'programado',
});

export function CursoFormModal({ open, onClose, curso }: { open: boolean; onClose: () => void; curso?: Curso | null }) {
  const guardar = useGuardarCurso();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CursoInput>({
    resolver: zodResolver(cursoSchema),
    defaultValues: vacio(),
  });

  useEffect(() => {
    if (!open) return;
    reset(
      curso
        ? {
            codigo: curso.codigo, nombre: curso.nombre, descripcion: curso.descripcion ?? '',
            fecha_inicio: curso.fecha_inicio, fecha_fin: curso.fecha_fin, horario: curso.horario ?? '',
            modalidad: curso.modalidad, costo: Number(curso.costo), cupos: curso.cupos, estado: curso.estado,
          }
        : vacio(),
    );
  }, [open, curso, reset]);

  const onSubmit = async (input: CursoInput) => {
    try {
      await guardar.mutateAsync({ id: curso?.id, input });
      notify.success(curso ? 'Curso actualizado' : 'Curso creado');
      onClose();
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={curso ? 'Editar curso' : 'Nuevo curso'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-curso" loading={isSubmitting}>Guardar</Button>
        </>
      }
    >
      <form id="form-curso" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-6" noValidate>
        <Field label="Código" required error={errors.codigo?.message} className="sm:col-span-2" hint="Ej. EXC-001">
          <Input className="uppercase" invalid={!!errors.codigo} {...register('codigo')} />
        </Field>
        <Field label="Nombre del curso" required error={errors.nombre?.message} className="sm:col-span-4">
          <Input invalid={!!errors.nombre} {...register('nombre')} />
        </Field>
        <Field label="Descripción" error={errors.descripcion?.message} className="sm:col-span-6">
          <Textarea {...register('descripcion')} />
        </Field>
        <Field label="Fecha de inicio" required error={errors.fecha_inicio?.message} className="sm:col-span-3">
          <Input type="date" invalid={!!errors.fecha_inicio} {...register('fecha_inicio')} />
        </Field>
        <Field label="Fecha de fin" required error={errors.fecha_fin?.message} className="sm:col-span-3">
          <Input type="date" invalid={!!errors.fecha_fin} {...register('fecha_fin')} />
        </Field>
        <Field label="Horario" error={errors.horario?.message} className="sm:col-span-6" hint="Ej. Lun-Mié 19:00-21:00">
          <Input {...register('horario')} />
        </Field>
        <Field label="Modalidad" required className="sm:col-span-2">
          <Select {...register('modalidad')}>
            {toOptions(MODALIDADES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Costo (S/)" required error={errors.costo?.message} className="sm:col-span-2">
          <Input type="number" step="0.01" min="0" inputMode="decimal" invalid={!!errors.costo} {...register('costo')} />
        </Field>
        <Field label="Cupos" required error={errors.cupos?.message} className="sm:col-span-2">
          <Input type="number" min="1" inputMode="numeric" invalid={!!errors.cupos} {...register('cupos')} />
        </Field>
        <Field label="Estado" required className="sm:col-span-3">
          <Select {...register('estado')}>
            {toOptions(ESTADOS_CURSO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
