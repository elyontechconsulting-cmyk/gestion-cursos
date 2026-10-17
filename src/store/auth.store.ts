import { create } from 'zustand';
import type { Session } from '@supabase/supabase-js';
import type { RolCodigo, Usuario } from '@/types/database';

interface AuthState {
  session: Session | null;
  perfil: Usuario | null;
  rol: RolCodigo | null;
  cargando: boolean;
  setSession: (s: Session | null) => void;
  setPerfil: (p: Usuario | null) => void;
  setCargando: (c: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>()((set) => ({
  session: null,
  perfil: null,
  rol: null,
  cargando: true,
  setSession: (session) => set({ session }),
  setPerfil: (perfil) => set({ perfil, rol: perfil?.activo ? (perfil.roles?.codigo ?? null) : null }),
  setCargando: (cargando) => set({ cargando }),
  reset: () => set({ session: null, perfil: null, rol: null, cargando: false }),
}));
