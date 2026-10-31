import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 1000 * 60 * 30,
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status;
        if (status && status >= 400 && status < 500) return false;
        return failureCount < 2;
      },
      refetchOnWindowFocus: false,
      networkMode: 'offlineFirst',
    },
    mutations: { networkMode: 'online' },
  },
});

export const queryKeys = {
  cursos: ['cursos'] as const,
  estudiantes: ['estudiantes'] as const,
  inscripciones: ['inscripciones'] as const,
  pagos: ['pagos'] as const,
  usuarios: ['usuarios'] as const,
  auditoria: ['auditoria'] as const,
  dashboard: ['dashboard'] as const,
  reportes: ['reportes'] as const,
  configuracion: ['configuracion'] as const,
  profesores: ['profesores'] as const,
  academico: ['academico'] as const,
  personal: ['personal'] as const,
};
