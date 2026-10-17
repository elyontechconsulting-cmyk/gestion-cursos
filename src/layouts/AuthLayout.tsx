import { Outlet } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';

export default function AuthLayout() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-zinc-50 to-white px-4 py-10 dark:from-[#0b0d12] dark:to-[#0f1117]">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
            <GraduationCap className="h-6 w-6" />
          </div>
          <h1 className="text-lg font-semibold">Gestión de Cursos</h1>
          <p className="text-sm text-zinc-500">Cursos, estudiantes, inscripciones y pagos</p>
        </div>
        <div className="card p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
