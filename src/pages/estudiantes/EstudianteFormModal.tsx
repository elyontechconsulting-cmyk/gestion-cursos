import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { estudianteSchema, type EstudianteInput } from '@/schemas/estudiante.schema';
import { useGuardarEstudiante } from '@/hooks/useEstudiantes';
import { useConsultaDni } from '@/hooks/useConsultaDni';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { ESTADOS_REGISTRO, toOptions } from '@/lib/constants';
import { notify } from '@/services/notify';
import { cn } from '@/utils/cn';
import type { Estudiante } from '@/types/database';

type FormValues = {
  dni: string; nombres: string; apellido_paterno: string; apellido_materno: string;
  correo: string; telefono: string; direccion: string; fecha_nacimiento: string; estado: 'activo' | 'inactivo';
};

const vacio: FormValues = {
  dni: '', nombres: '', apellido_paterno: '', apellido_materno: '', correo: '', telefono: '',
  direccion: '', fecha_nacimiento: '', estado: 'activo',
};

export function EstudianteFormModal({ open, onClose, estudiante, onCreado }: {
  open: boolean;
  onClose: () => void;
  estudiante?: Estudiante | null;
  onCreado?: (e: Estudiante) => void;
}) {
  const guardar = useGuardarEstudiante();
  const editando = !!estudiante;
  const { register, handleSubmit, reset, watch, setValue, getValues, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, EstudianteInput>({
    resolver: zodResolver(estudianteSchema),
    defaultValues: vacio,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      estudiante
        ? {
            dni: estudiante.dni, nombres: estudiante.nombres, apellido_paterno: estudiante.apellido_paterno,
            apellido_materno: estudiante.apellido_materno, correo: estudiante.correo ?? '', telefono: estudiante.telefono ?? '',
            direccion: estudiante.direccion ?? '', fecha_nacimiento: estudiante.fecha_nacimiento ?? '', estado: estudiante.estado,
          }
        : vacio,
    );
  }, [open, estudiante, reset]);

  const dni = watch('dni');
  const consulta = useConsultaDni(dni, open && !editando, (d) => {
    setValue('nombres', d.nombres, { shouldValidate: true });
    setValue('apellido_paterno', d.apellidoPaterno, { shouldValidate: true });
    setValue('apellido_materno', d.apellidoMaterno, { shouldValidate: true });
    if (d.fechaNacimiento && !getValues('fecha_nacimiento')) {
      setValue('fecha_nacimiento', d.fechaNacimiento, { shouldValidate: true });
    }
  });

  const onSubmit = async (input: EstudianteInput) => {
    try {
      const e = await guardar.mutateAsync({ id: estudiante?.id, input });
      notify.success(editando ? 'Estudiante actualizado' : 'Estudiante registrado');
      if (!editando) onCreado?.(e);
      onClose();
    } catch (e) {
      notify.error(e);
    }
  };

  const IconoEstado = { buscando: Loader2, encontrado: CheckCircle2, duplicado: AlertCircle, error: AlertCircle, idle: null }[consulta.estado];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editando ? 'Editar estudiante' : 'Nuevo estudiante'}
      description={editando ? undefined : 'Ingrese el DNI y los nombres se completarán automáticamente'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-estudiante" loading={isSubmitting} disabled={consulta.estado === 'duplicado'}>Guardar</Button>
        </>
      }
    >
      <form id="form-estudiante" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-6" noValidate>
        <Field
          label="DNI" required error={errors.dni?.message} className="sm:col-span-2"
          hint={IconoEstado && (
            <span className={cn('inline-flex items-center gap-1', {
              'text-emerald-600': consulta.estado === 'encontrado',
              'text-red-600': consulta.estado === 'duplicado',
              'text-amber-600': consulta.estado === 'error',
            })}>
              <IconoEstado className={cn('h-3 w-3', consulta.estado === 'buscando' && 'animate-spin')} /> {consulta.mensaje}
            </span>
          )}
        >
          <Input
            inputMode="numeric" maxLength={8} autoComplete="off" disabled={editando} invalid={!!errors.dni}
            {...register('dni', { onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8)) })}
          />
        </Field>
        <Field label="Nombres" required error={errors.nombres?.message} className="sm:col-span-4">
          <Input invalid={!!errors.nombres} {...register('nombres')} />
        </Field>
        <Field label="Apellido paterno" required error={errors.apellido_paterno?.message} className="sm:col-span-3">
          <Input invalid={!!errors.apellido_paterno} {...register('apellido_paterno')} />
        </Field>
        <Field label="Apellido materno" error={errors.apellido_materno?.message} className="sm:col-span-3">
          <Input {...register('apellido_materno')} />
        </Field>
        <Field label="Correo electrónico" error={errors.correo?.message} className="sm:col-span-3">
          <Input type="email" autoComplete="email" invalid={!!errors.correo} {...register('correo')} />
        </Field>
        <Field label="Teléfono" error={errors.telefono?.message} className="sm:col-span-3" hint="Celular de 9 dígitos o fijo">
          <Input type="tel" inputMode="tel" autoComplete="tel" invalid={!!errors.telefono} {...register('telefono')} />
        </Field>
        <Field label="Dirección" error={errors.direccion?.message} className="sm:col-span-6">
          <Input autoComplete="street-address" {...register('direccion')} />
        </Field>
        <Field label="Fecha de nacimiento" error={errors.fecha_nacimiento?.message} className="sm:col-span-3">
          <Input type="date" invalid={!!errors.fecha_nacimiento} {...register('fecha_nacimiento')} />
        </Field>
        <Field label="Estado" className="sm:col-span-3">
          <Select {...register('estado')}>
            {toOptions(ESTADOS_REGISTRO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}
