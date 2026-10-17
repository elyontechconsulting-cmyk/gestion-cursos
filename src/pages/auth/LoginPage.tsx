import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import { loginSchema, type LoginInput } from '@/schemas/auth.schema';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Field, Input } from '@/components/ui';
import { notify } from '@/services/notify';

export default function LoginPage() {
  const { iniciarSesion } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destino = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/';
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (d: LoginInput) => {
    try {
      await iniciarSesion(d.email, d.password);
      navigate(destino, { replace: true });
    } catch (e) {
      notify.error(e, 'No se pudo iniciar sesión');
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-base font-semibold">Iniciar sesión</h2>
        <p className="text-sm text-zinc-500">Ingrese con su cuenta institucional</p>
      </div>
      <Field label="Correo electrónico" error={errors.email?.message} htmlFor="email">
        <Input id="email" type="email" autoComplete="email" invalid={!!errors.email} {...register('email')} />
      </Field>
      <Field label="Contraseña" error={errors.password?.message} htmlFor="password">
        <Input id="password" type="password" autoComplete="current-password" invalid={!!errors.password} {...register('password')} />
      </Field>
      <Button type="submit" className="w-full" loading={isSubmitting} icon={<LogIn className="h-4 w-4" />}>Ingresar</Button>
      <p className="text-center text-sm">
        <Link to="/recuperar" className="text-brand-600 hover:underline dark:text-brand-400">¿Olvidó su contraseña?</Link>
      </p>
    </form>
  );
}
