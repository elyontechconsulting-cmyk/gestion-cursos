import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Save } from 'lucide-react';
import { configuracionSchema, type ConfiguracionInput } from '@/schemas/configuracion.schema';
import { useConfiguracion, useGuardarConfiguracion } from '@/hooks/useConfiguracion';
import { Button, Card, Field, Input, PageHeader, PantallaCarga } from '@/components/ui';
import { formatFechaHora } from '@/utils/format';
import { notify } from '@/services/notify';

/** Datos de la organización que se imprimen en recibos y reportes. */
export default function ConfiguracionPage() {
  const { data, isLoading } = useConfiguracion();
  const guardar = useGuardarConfiguracion();
  const { register, handleSubmit, reset, formState: { errors, isSubmitting, isDirty } } = useForm<ConfiguracionInput>({
    resolver: zodResolver(configuracionSchema),
  });

  useEffect(() => {
    if (!data) return;
    reset({
      nombre_organizacion: data.nombre_organizacion,
      ruc: data.ruc ?? '',
      direccion: data.direccion ?? '',
      telefono: data.telefono ?? '',
      correo: data.correo ?? '',
    });
  }, [data, reset]);

  const onSubmit = async (input: ConfiguracionInput) => {
    try {
      await guardar.mutateAsync(input);
      notify.success('Configuración guardada');
    } catch (e) {
      notify.error(e);
    }
  };

  if (isLoading) return <PantallaCarga />;

  return (
    <>
      <PageHeader title="Configuración" description="Datos de la organización que aparecen en los recibos y reportes" />
      <Card
        title="Organización"
        description={data ? `Última modificación: ${formatFechaHora(data.updated_at)}` : undefined}
        className="max-w-3xl"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
          <Field label="Nombre de la organización" required error={errors.nombre_organizacion?.message} className="sm:col-span-2">
            <Input invalid={!!errors.nombre_organizacion} {...register('nombre_organizacion')} />
          </Field>
          <Field label="RUC" error={errors.ruc?.message}>
            <Input inputMode="numeric" maxLength={11} autoComplete="off" invalid={!!errors.ruc} {...register('ruc')} />
          </Field>
          <Field label="Teléfono" error={errors.telefono?.message}>
            <Input type="tel" invalid={!!errors.telefono} {...register('telefono')} />
          </Field>
          <Field label="Dirección" error={errors.direccion?.message} className="sm:col-span-2">
            <Input invalid={!!errors.direccion} {...register('direccion')} />
          </Field>
          <Field label="Correo" error={errors.correo?.message} className="sm:col-span-2">
            <Input type="email" invalid={!!errors.correo} {...register('correo')} />
          </Field>
          <div className="flex justify-end sm:col-span-2">
            <Button type="submit" loading={isSubmitting} disabled={!isDirty} icon={<Save className="h-4 w-4" />}>
              Guardar cambios
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
