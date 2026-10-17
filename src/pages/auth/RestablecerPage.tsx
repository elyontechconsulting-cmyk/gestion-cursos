import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { nuevaPasswordSchema, type NuevaPasswordInput } from '@/schemas/auth.schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Field, Input } from '@/components/ui';
import { notify } from '@/services/notify';

/** Destino del enlace de recuperación / invitación enviado por Supabase Auth. */
export default function RestablecerPage() {
  const { cambiarPassword, session } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NuevaPasswordInput>({ resolver: zodResolver(nuevaPasswordSchema) });

  const onSubmit = async (d: NuevaPasswordInput) => {
    try {
      await cambiarPassword(d.password);
      notify.success('Contraseña actualizada');
      navigate('/', { replace: true });
    } catch (e) {
      notify.error(e);
    }
  };

  if (!session) return <p className="text-center text-sm text-zinc-500">El enlace no es válido o ya expiró. Solicite uno nuevo.</p>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <h2 className="text-base font-semibold">Nueva contraseña</h2>
      <Field label="Contraseña" error={errors.password?.message} hint="Mínimo 10 caracteres, una mayúscula y un número">
        <Input type="password" autoComplete="new-password" invalid={!!errors.password} {...register('password')} />
      </Field>
      <Field label="Confirmar contraseña" error={errors.confirmar?.message}>
        <Input type="password" autoComplete="new-password" invalid={!!errors.confirmar} {...register('confirmar')} />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>Guardar</Button>
    </form>
  );
}
