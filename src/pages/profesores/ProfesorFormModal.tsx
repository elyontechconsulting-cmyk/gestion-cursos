import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { profesorSchema, type ProfesorInput } from '@/schemas/profesor.schema';
import { useGuardarProfesor } from '@/hooks/useProfesores';
import { useConsultaDni, type BuscarExistente } from '@/hooks/useConsultaDni';
import { profesoresApi } from '@/api/profesores.api';
import { Button, Field, Input, Modal, Select } from '@/components/ui';
import { ESTADOS_REGISTRO, toOptions } from '@/lib/constants';
import { notify } from '@/services/notify';
import { cn } from '@/utils/cn';
import type { Profesor } from '@/types/database';

type FormValues = {
  dni: string; nombres: string; apellidos: string; telefono: string; correo: string; especialidad: string;
  estado: 'activo' | 'inactivo';
};

const vacio: FormValues = { dni: '', nombres: '', apellidos: '', telefono: '', correo: '', especialidad: '', estado: 'activo' };

const profesorExistente: BuscarExistente = async (dni) => {
  const p = await profesoresApi.porDni(dni);
  return p ? `${p.nombres} ${p.apellidos}` : null;
};

export function ProfesorFormModal({ open, onClose, profesor }: { open: boolean; onClose: () => void; profesor?: Profesor | null }) {
  const guardar = useGuardarProfesor();
  const editando = !!profesor;
  const { register, handleSubmit, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues, unknown, ProfesorInput>({
    resolver: zodResolver(profesorSchema),
    defaultValues: vacio,
  });

  useEffect(() => {
    if (!open) return;
    reset(
      profesor
        ? {
            dni: profesor.dni ?? '', nombres: profesor.nombres, apellidos: profesor.apellidos, telefono: profesor.telefono ?? '',
            correo: profesor.correo ?? '', especialidad: profesor.especialidad ?? '', estado: profesor.estado,
          }
        : vacio,
    );
  }, [open, profesor, reset]);

  // Igual que en estudiantes: con 8 dígitos se buscan los nombres en RENIEC (solo al registrar)
  const consulta = useConsultaDni(watch('dni'), open && !editando, (d) => {
    setValue('nombres', d.nombres, { shouldValidate: true });
    setValue('apellidos', [d.apellidoPaterno, d.apellidoMaterno].filter(Boolean).join(' '), { shouldValidate: true });
  }, profesorExistente);

  const IconoEstado = { buscando: Loader2, encontrado: CheckCircle2, duplicado: AlertCircle, error: AlertCircle, idle: null }[consulta.estado];

  const onSubmit = async (input: ProfesorInput) => {
    try {
      await guardar.mutateAsync({ id: profesor?.id, input });
      notify.success(profesor ? 'Profesor actualizado' : 'Profesor registrado');
      onClose();
    } catch (e) {
      notify.error(e);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={profesor ? 'Editar profesor' : 'Nuevo profesor'}
      description={editando ? undefined : 'Ingrese el DNI y los nombres se completarán automáticamente'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" form="form-profesor" loading={isSubmitting} disabled={consulta.estado === 'duplicado'}>Guardar</Button>
        </>
      }
    >
      <form id="form-profesor" onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-6" noValidate>
        <Field
          label="DNI" error={errors.dni?.message} className="sm:col-span-2"
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
            inputMode="numeric" maxLength={8} autoComplete="off" invalid={!!errors.dni}
            {...register('dni', { onChange: (e) => (e.target.value = e.target.value.replace(/\D/g, '').slice(0, 8)) })}
          />
        </Field>
        <Field label="Nombres" required error={errors.nombres?.message} className="sm:col-span-4">
          <Input invalid={!!errors.nombres} {...register('nombres')} />
        </Field>
        <Field label="Apellidos" required error={errors.apellidos?.message} className="sm:col-span-6" hint="Paterno y materno">
          <Input invalid={!!errors.apellidos} {...register('apellidos')} />
        </Field>
        <Field label="Teléfono" error={errors.telefono?.message} className="sm:col-span-3">
          <Input inputMode="tel" invalid={!!errors.telefono} {...register('telefono')} />
        </Field>
        <Field label="Estado" required className="sm:col-span-3">
          <Select {...register('estado')}>
            {toOptions(ESTADOS_REGISTRO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Correo" error={errors.correo?.message} className="sm:col-span-3">
          <Input type="email" invalid={!!errors.correo} {...register('correo')} />
        </Field>
        <Field label="Especialidad" error={errors.especialidad?.message} className="sm:col-span-3">
          <Input {...register('especialidad')} />
        </Field>
      </form>
    </Modal>
  );
}
