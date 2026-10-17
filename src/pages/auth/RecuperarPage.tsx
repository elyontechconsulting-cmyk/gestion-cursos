import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'react-router-dom';
import { recuperarSchema, type RecuperarInput } from '@/schemas/auth.schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Field, Input } from '@/components/ui';
import { notify } from '@/services/notify';

export default function RecuperarPage() {
  const { recuperarPassword } = useAuth();
  const [enviado, setEnviado] = useState(false);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RecuperarInput>({ resolver: zodResolver(recuperarSchema) });

  const onSubmit = async (d: RecuperarInput) => {
    try {
      await recuperarPassword(d.email);
      setEnviado(true);
    } catch (e) {
      notify.error(e);
    }
  };

  if (enviado)
    return (
      <div className="space-y-3 text-center text-sm">
        <p className="font-medium">Revise su correo</p>
        <p className="text-zinc-500">Si la cuenta existe, recibirá un enlace para restablecer su contraseña.</p>
        <Link to="/login" className="text-brand-600 hover:underline">Volver al inicio de sesión</Link>
      </div>
    );

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-base font-semibold">Recuperar contraseña</h2>
        <p className="text-sm text-zinc-500">Le enviaremos un enlace a su correo</p>
      </div>
      <Field label="Correo electrónico" error={errors.email?.message}>
        <Input type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting}>Enviar enlace</Button>
      <p className="text-center text-sm"><Link to="/login" className="text-brand-600 hover:underline">Volver</Link></p>
    </form>
  );
}
