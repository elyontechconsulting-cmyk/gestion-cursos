import { lazy } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/layouts/AppLayout';
import AuthLayout from '@/layouts/AuthLayout';
import { RequireAuth, RequirePermiso, SoloInvitados } from './guards';
import { useAuth } from '@/contexts/AuthContext';
import { puede } from '@/lib/permissions';

const Login = lazy(() => import('@/pages/auth/LoginPage'));
const Recuperar = lazy(() => import('@/pages/auth/RecuperarPage'));
const Restablecer = lazy(() => import('@/pages/auth/RestablecerPage'));
const Dashboard = lazy(() => import('@/pages/dashboard/DashboardPage'));
const Cursos = lazy(() => import('@/pages/cursos/CursosPage'));
const CursoDetalle = lazy(() => import('@/pages/cursos/CursoDetallePage'));
const Estudiantes = lazy(() => import('@/pages/estudiantes/EstudiantesPage'));
const Profesores = lazy(() => import('@/pages/profesores/ProfesoresPage'));
const Academico = lazy(() => import('@/pages/academico/AcademicoPage'));
const RegistroAcademico = lazy(() => import('@/pages/academico/RegistroAcademicoPage'));
const Inscripciones = lazy(() => import('@/pages/inscripciones/InscripcionesPage'));
const Pagos = lazy(() => import('@/pages/pagos/PagosPage'));
const Reportes = lazy(() => import('@/pages/reportes/ReportesPage'));
const Usuarios = lazy(() => import('@/pages/usuarios/UsuariosPage'));
const Auditoria = lazy(() => import('@/pages/auditoria/AuditoriaPage'));
const Configuracion = lazy(() => import('@/pages/configuracion/ConfiguracionPage'));
const SinAcceso = lazy(() => import('@/pages/SinAccesoPage'));
const NoEncontrado = lazy(() => import('@/pages/NotFoundPage'));

/** Página de inicio según el rol: dashboard si tiene permiso, si no, reportes. */
function Inicio() {
  const { rol } = useAuth();
  return puede(rol, 'dashboard.ver') ? <Dashboard /> : <Navigate to="/reportes" replace />;
}

export const router = createBrowserRouter([
  {
    element: <AuthLayout />,
    children: [
      { path: '/login', element: <SoloInvitados><Login /></SoloInvitados> },
      { path: '/recuperar', element: <SoloInvitados><Recuperar /></SoloInvitados> },
      { path: '/restablecer', element: <Restablecer /> },
    ],
  },
  {
    element: <RequireAuth><AppLayout /></RequireAuth>,
    children: [
      { index: true, path: '/', element: <Inicio /> },
      { path: '/cursos', element: <RequirePermiso permiso="cursos.ver"><Cursos /></RequirePermiso> },
      { path: '/cursos/:id', element: <RequirePermiso permiso="cursos.ver"><CursoDetalle /></RequirePermiso> },
      { path: '/estudiantes', element: <RequirePermiso permiso="estudiantes.ver"><Estudiantes /></RequirePermiso> },
      { path: '/profesores', element: <RequirePermiso permiso="profesores.ver"><Profesores /></RequirePermiso> },
      { path: '/academico', element: <RequirePermiso permiso="academico.ver"><Academico /></RequirePermiso> },
      { path: '/academico/:id', element: <RequirePermiso permiso="academico.ver"><RegistroAcademico /></RequirePermiso> },
      { path: '/inscripciones', element: <RequirePermiso permiso="inscripciones.ver"><Inscripciones /></RequirePermiso> },
      { path: '/pagos', element: <RequirePermiso permiso="pagos.ver"><Pagos /></RequirePermiso> },
      { path: '/reportes', element: <RequirePermiso permiso="reportes.ver"><Reportes /></RequirePermiso> },
      { path: '/usuarios', element: <RequirePermiso permiso="usuarios.gestionar"><Usuarios /></RequirePermiso> },
      { path: '/auditoria', element: <RequirePermiso permiso="auditoria.ver"><Auditoria /></RequirePermiso> },
      { path: '/configuracion', element: <RequirePermiso permiso="configuracion.gestionar"><Configuracion /></RequirePermiso> },
      { path: '/sin-acceso', element: <SinAcceso /> },
      { path: '*', element: <NoEncontrado /> },
    ],
  },
]);
