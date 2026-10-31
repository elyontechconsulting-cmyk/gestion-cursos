import { useEffect } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { cursoSchema, type CursoInput } from '@/schemas/curso.schema';
import { useGuardarCurso } from '@/hooks/useCursos';
import { usePersonal } from '@/hooks/useAcademico';
import { useProfesoresOpciones } from '@/hooks/useProfesores';
import { Button, Field, Input, Modal, Select, Textarea } from '@/components/ui';
import { ESTADOS_CURSO, MODALIDADES, ROLES, toOptions } from '@/lib/constants';
import { notify } from '@/services/notify';
import { hoyISO } from '@/utils/format';
import { sumarDias } from '@/utils/date';
import type { CursoResumen } from '@/types/database';

const vacio = (): CursoInput => ({
  codigo: '', nombre: '', descripcion: '', fecha_inicio: hoyISO(), fecha_fin: sumarDias(hoyISO(), 30),
  horario: '', modalidad: 'presencial', costo: 0, cupos: 20, estado: 'programado',
  tutor_id: '', profesor_ids: [], numero_sesiones: 9, faltas_maximas: 3, nota_aprobatoria: 11,
});

export function CursoFormModal({ open, onClose, curso }: { open: boolean; onClose: () => void; curso?: CursoResumen | null }) {
  const guardar = useGuardarCurso();
  const { data: personal = [] } = usePersonal(open);
  const { data: profesores = [] } = useProfesoresOpciones(open);
  const { register, handleSubmit, reset, control, formState: { errors, isSubmitting } } = useForm<CursoInput>({
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
            tutor_id: curso.tutor_id ?? '', profesor_ids: curso.profesor_ids ?? [], numero_sesiones: curso.numero_sesiones,
            faltas_maximas: curso.faltas_maximas, nota_aprobatoria: Number(curso.nota_aprobatoria),
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

        <h3 className="border-t border-zinc-100 pt-4 text-sm font-semibold sm:col-span-6 dark:border-white/[0.06]">Gestión académica</h3>
        <Field label="Tutor / asistente" className="sm:col-span-3" hint="Registra asistencias y notas del curso">
          <Select {...register('tutor_id')}>
            <option value="">Sin asignar</option>
            {personal.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre_completo || p.email} · {ROLES[p.rol]}</option>
            ))}
          </Select>
        </Field>
        <Field label="Sesiones" required error={errors.numero_sesiones?.message} className="sm:col-span-1">
          <Input type="number" min="1" inputMode="numeric" invalid={!!errors.numero_sesiones} {...register('numero_sesiones')} />
        </Field>
        <Field label="Faltas máx." required error={errors.faltas_maximas?.message} className="sm:col-span-1" hint="Desaprueba al llegar">
          <Input type="number" min="1" inputMode="numeric" invalid={!!errors.faltas_maximas} {...register('faltas_maximas')} />
        </Field>
        <Field label="Nota mínima" required error={errors.nota_aprobatoria?.message} className="sm:col-span-1" hint="Para aprobar">
          <Input type="number" step="0.5" min="0" max="20" inputMode="decimal" invalid={!!errors.nota_aprobatoria} {...register('nota_aprobatoria')} />
        </Field>
        <Field label="Profesores" className="sm:col-span-6">
          <Controller
            control={control}
            name="profesor_ids"
            render={({ field }) =>
              profesores.length ? (
                <div className="grid max-h-44 gap-1 overflow-y-auto rounded-lg border border-zinc-200 p-2 sm:grid-cols-2 dark:border-white/10">
                  {profesores.map((p) => (
                    <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-zinc-50 dark:hover:bg-white/[0.04]">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-zinc-300 text-brand-600 focus:ring-brand-500"
                        checked={field.value.includes(p.id)}
                        onChange={(e) => field.onChange(e.target.checked ? [...field.value, p.id] : field.value.filter((x) => x !== p.id))}
                      />
                      <span className="truncate">{p.apellidos}, {p.nombres}</span>
                      {p.especialidad && <span className="truncate text-xs text-zinc-500">· {p.especialidad}</span>}
                    </label>
                  ))}
                </div>
              ) : (
                <p className="rounded-lg border border-dashed border-zinc-200 p-3 text-sm text-zinc-500 dark:border-white/10">
                  No hay profesores activos. Regístrelos en el menú Profesores.
                </p>
              )
            }
          />
        </Field>
      </form>
    </Modal>
  );
}
