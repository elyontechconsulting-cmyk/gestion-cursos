import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { puede, type Permiso } from '@/lib/permissions';
import { PantallaCarga } from '@/components/ui';
import { env } from '@/lib/env';
import ConfiguracionPendiente from '@/pages/auth/ConfiguracionPendiente';

/** Exige sesión iniciada y perfil activo. */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { session, perfil, cargando } = useAuth();
  const location = useLocation();
  if (!env.configured) return <ConfiguracionPendiente />;
  if (cargando) return <PantallaCarga texto="Verificando sesión…" />;
  if (!session || !perfil?.activo) return <Navigate to="/login" replace state={{ from: location }} />;
  return <>{children}</>;
}

/** Exige un permiso concreto según el rol. */
export function RequirePermiso({ permiso, children }: { permiso: Permiso; children: ReactNode }) {
  const { rol } = useAuth();
  if (!puede(rol, permiso)) return <Navigate to="/sin-acceso" replace />;
  return <>{children}</>;
}

/** Redirige a inicio si ya hay sesión (para /login). */
export function SoloInvitados({ children }: { children: ReactNode }) {
  const { session, perfil, cargando } = useAuth();
  if (cargando) return <PantallaCarga />;
  if (session && perfil?.activo) return <Navigate to="/" replace />;
  return <>{children}</>;
}
