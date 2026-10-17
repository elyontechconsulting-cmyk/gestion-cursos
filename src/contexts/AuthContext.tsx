import { createContext, useCallback, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { queryClient } from '@/lib/queryClient';
import { usuariosApi } from '@/api/usuarios.api';
import { useAuthStore } from '@/store/auth.store';
import type { RolCodigo, Usuario } from '@/types/database';
import type { Session } from '@supabase/supabase-js';

interface AuthContextValue {
  session: Session | null;
  perfil: Usuario | null;
  rol: RolCodigo | null;
  cargando: boolean;
  iniciarSesion: (email: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  recuperarPassword: (email: string) => Promise<void>;
  cambiarPassword: (password: string) => Promise<void>;
  recargarPerfil: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { session, perfil, rol, cargando, setSession, setPerfil, setCargando, reset } = useAuthStore();

  const cargarPerfil = useCallback(
    async (s: Session | null) => {
      if (!s) {
        setPerfil(null);
        return;
      }
      try {
        setPerfil(await usuariosApi.perfil(s.user.id));
      } catch (e) {
        console.error('No se pudo cargar el perfil', e);
        setPerfil(null);
      }
    },
    [setPerfil],
  );

  useEffect(() => {
    let activo = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!activo) return;
      setSession(data.session);
      await cargarPerfil(data.session);
      setCargando(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === 'SIGNED_OUT') {
        queryClient.clear();
        reset();
        return;
      }
      if (event === 'SIGNED_IN' || event === 'USER_UPDATED') {
        // Diferir para no bloquear el callback de Supabase
        setTimeout(() => void cargarPerfil(s), 0);
      }
    });
    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [cargarPerfil, reset, setCargando, setSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      perfil,
      rol,
      cargando,
      async iniciarSesion(email, password) {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const p = await usuariosApi.perfil(data.user.id);
        if (!p || !p.activo) {
          await supabase.auth.signOut();
          throw new Error('Su usuario está inactivo o no tiene un perfil asignado. Contacte al administrador.');
        }
        setPerfil(p);
      },
      async cerrarSesion() {
        await supabase.auth.signOut();
      },
      async recuperarPassword(email) {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/restablecer`,
        });
        if (error) throw error;
      },
      async cambiarPassword(password) {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
      },
      recargarPerfil: () => cargarPerfil(session),
    }),
    [session, perfil, rol, cargando, cargarPerfil, setPerfil],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de <AuthProvider>');
  return ctx;
}
