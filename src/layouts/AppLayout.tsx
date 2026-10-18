import { Suspense, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  BarChart3, BookOpen, ChevronsLeft, ClipboardList, GraduationCap, History, LayoutDashboard, LogOut, Menu,
  Moon, Monitor, Settings, Sun, Users, Wallet, WifiOff, X, UserCog,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePermisos } from '@/hooks/usePermisos';
import { useOnline } from '@/hooks/useOnline';
import { useRealtime } from '@/hooks/useRealtime';
import { useShallow } from 'zustand/react/shallow';
import { useUiStore, type Tema } from '@/store/ui.store';
import type { Permiso } from '@/lib/permissions';
import { ROLES } from '@/lib/constants';
import { cn } from '@/utils/cn';
import { notify } from '@/services/notify';
import { PantallaCarga } from '@/components/ui';
import { InstallBanner } from '@/components/layout/InstallBanner';
import { UpdatePrompt } from '@/components/layout/UpdatePrompt';

interface NavItem { to: string; label: string; icon: typeof BookOpen; permiso: Permiso }

const NAV: { grupo: string; items: NavItem[] }[] = [
  { grupo: 'General', items: [{ to: '/', label: 'Dashboard', icon: LayoutDashboard, permiso: 'dashboard.ver' }] },
  {
    grupo: 'Académico',
    items: [
      { to: '/cursos', label: 'Cursos', icon: BookOpen, permiso: 'cursos.ver' },
      { to: '/estudiantes', label: 'Estudiantes', icon: Users, permiso: 'estudiantes.ver' },
      { to: '/inscripciones', label: 'Inscripciones', icon: ClipboardList, permiso: 'inscripciones.ver' },
    ],
  },
  { grupo: 'Finanzas', items: [{ to: '/pagos', label: 'Pagos', icon: Wallet, permiso: 'pagos.ver' }] },
  { grupo: 'Análisis', items: [{ to: '/reportes', label: 'Reportes', icon: BarChart3, permiso: 'reportes.ver' }] },
  {
    grupo: 'Administración',
    items: [
      { to: '/usuarios', label: 'Usuarios', icon: UserCog, permiso: 'usuarios.gestionar' },
      { to: '/auditoria', label: 'Auditoría', icon: History, permiso: 'auditoria.ver' },
      { to: '/configuracion', label: 'Configuración', icon: Settings, permiso: 'configuracion.gestionar' },
    ],
  },
];

export default function AppLayout() {
  const { colapsado, movil, toggle, setMovil } = useUiStore(
    useShallow((s) => ({
      colapsado: s.sidebarColapsado, movil: s.sidebarMovilAbierto, toggle: s.toggleSidebar, setMovil: s.setSidebarMovil,
    })),
  );
  const online = useOnline();
  const location = useLocation();
  useRealtime(online);

  useEffect(() => setMovil(false), [location.pathname, setMovil]);

  return (
    <div className="flex min-h-screen">
      {/* Overlay móvil */}
      {movil && <div className="fixed inset-0 z-30 bg-zinc-950/40 lg:hidden" onClick={() => setMovil(false)} />}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex flex-col border-r border-zinc-200 bg-zinc-50/95 backdrop-blur transition-all duration-200 pt-safe dark:border-white/[0.06] dark:bg-[#0d0f14]/95',
          colapsado ? 'lg:w-[68px]' : 'lg:w-60',
          movil ? 'w-64 translate-x-0' : 'w-64 -translate-x-full lg:translate-x-0',
        )}
      >
        <Sidebar colapsado={colapsado} onToggle={toggle} onCerrarMovil={() => setMovil(false)} />
      </aside>

      <div className={cn('flex min-w-0 flex-1 flex-col transition-all duration-200', colapsado ? 'lg:pl-[68px]' : 'lg:pl-60')}>
        <Topbar onMenu={() => setMovil(true)} />
        {!online && (
          <div className="flex items-center justify-center gap-2 bg-amber-500 px-4 py-1.5 text-xs font-medium text-amber-950">
            <WifiOff className="h-3.5 w-3.5" /> Sin conexión: mostrando datos guardados. Los cambios requieren internet.
          </div>
        )}
        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-safe sm:px-6 lg:px-8 lg:py-7">
          <Suspense fallback={<PantallaCarga />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <InstallBanner />
      <UpdatePrompt />
    </div>
  );
}

function Sidebar({ colapsado, onToggle, onCerrarMovil }: { colapsado: boolean; onToggle: () => void; onCerrarMovil: () => void }) {
  const { puede } = usePermisos();
  return (
    <>
      <div className="flex h-14 items-center gap-2.5 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
          <GraduationCap className="h-[18px] w-[18px]" />
        </div>
        <span className={cn('truncate text-sm font-semibold', colapsado && 'lg:hidden')}>Gestión de Cursos</span>
        <button onClick={onCerrarMovil} className="ml-auto rounded p-1 text-zinc-500 lg:hidden" aria-label="Cerrar menú">
          <X className="h-4 w-4" />
        </button>
      </div>
      <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-3">
        {NAV.map((g) => {
          const items = g.items.filter((i) => puede(i.permiso));
          if (!items.length) return null;
          return (
            <div key={g.grupo}>
              <p className={cn('mb-1 px-2 text-[11px] font-medium uppercase tracking-wider text-zinc-400', colapsado && 'lg:hidden')}>{g.grupo}</p>
              <ul className="space-y-0.5">
                {items.map((i) => (
                  <li key={i.to}>
                    <NavLink
                      to={i.to}
                      end={i.to === '/'}
                      title={colapsado ? i.label : undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                          isActive
                            ? 'bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200 dark:bg-white/[0.07] dark:text-white dark:ring-white/10'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100',
                          colapsado && 'lg:justify-center lg:px-0',
                        )
                      }
                    >
                      <i.icon className="h-[18px] w-[18px] shrink-0" />
                      <span className={cn(colapsado && 'lg:hidden')}>{i.label}</span>
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      <div className="hidden border-t border-zinc-200 p-3 lg:block dark:border-white/[0.06]">
        <button
          onClick={onToggle}
          className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-sm text-zinc-500 hover:bg-zinc-100 dark:hover:bg-white/[0.04]"
          aria-label={colapsado ? 'Expandir menú' : 'Colapsar menú'}
        >
          <ChevronsLeft className={cn('h-[18px] w-[18px] transition-transform', colapsado && 'rotate-180 mx-auto')} />
          <span className={cn(colapsado && 'hidden')}>Colapsar</span>
        </button>
      </div>
    </>
  );
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { perfil, rol, cerrarSesion } = useAuth();
  const { tema, setTema } = useUiStore(useShallow((s) => ({ tema: s.tema, setTema: s.setTema })));
  const opcionesTema: { valor: Tema; label: string; icon: typeof Sun }[] = [
    { valor: 'light', label: 'Claro', icon: Sun },
    { valor: 'dark', label: 'Oscuro', icon: Moon },
    { valor: 'system', label: 'Sistema', icon: Monitor },
  ];

  const salir = async () => {
    if (await notify.confirm({ title: '¿Cerrar sesión?', confirmText: 'Cerrar sesión' })) await cerrarSesion();
  };

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/80 px-4 backdrop-blur pt-safe sm:px-6 dark:border-white/[0.06] dark:bg-[#0b0d12]/80">
      <button onClick={onMenu} className="rounded-md p-1.5 text-zinc-600 hover:bg-zinc-100 lg:hidden dark:text-zinc-300 dark:hover:bg-white/10" aria-label="Abrir menú">
        <Menu className="h-5 w-5" />
      </button>
      <div className="ml-auto flex items-center gap-2">
        <div role="radiogroup" aria-label="Tema" className="inline-flex rounded-lg bg-zinc-100 p-0.5 dark:bg-white/[0.06]">
          {opcionesTema.map((o) => (
            <button
              key={o.valor}
              role="radio"
              aria-checked={tema === o.valor}
              onClick={() => setTema(o.valor)}
              title={`Tema ${o.label.toLowerCase()}`}
              className={cn(
                'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition',
                tema === o.valor
                  ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/15 dark:text-white'
                  : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100',
              )}
            >
              <o.icon className="h-4 w-4" />
              <span className="hidden md:inline">{o.label}</span>
            </button>
          ))}
        </div>
        <div className="hidden text-right sm:block">
          <p className="max-w-[180px] truncate text-sm font-medium leading-tight">{perfil?.nombre_completo || perfil?.email}</p>
          <p className="text-xs text-zinc-500">{rol ? ROLES[rol] : ''}</p>
        </div>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-xs font-semibold text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
          {(perfil?.nombre_completo || perfil?.email || '?').slice(0, 1).toUpperCase()}
        </div>
        <button onClick={salir} className="rounded-md p-2 text-zinc-500 hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-white/10" aria-label="Cerrar sesión" title="Cerrar sesión">
          <LogOut className="h-[18px] w-[18px]" />
        </button>
      </div>
    </header>
  );
}
