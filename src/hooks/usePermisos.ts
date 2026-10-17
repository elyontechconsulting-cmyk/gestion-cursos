import { useAuth } from '@/contexts/AuthContext';
import { puede, type Permiso } from '@/lib/permissions';

export function usePermisos() {
  const { rol } = useAuth();
  return { rol, puede: (p: Permiso) => puede(rol, p) };
}
