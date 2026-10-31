import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { academicoApi } from '@/api/academico.api';
import { queryKeys } from '@/lib/queryClient';

export const useNotas = (cursoId?: string) =>
  useQuery({ queryKey: [...queryKeys.academico, 'notas', cursoId], queryFn: () => academicoApi.notas(cursoId!), enabled: !!cursoId });

export const useAsistencias = (cursoId?: string) =>
  useQuery({
    queryKey: [...queryKeys.academico, 'asistencias', cursoId],
    queryFn: () => academicoApi.asistencias(cursoId!),
    enabled: !!cursoId,
  });

export const usePersonal = (enabled = true) =>
  useQuery({ queryKey: queryKeys.personal, queryFn: academicoApi.personal, enabled, staleTime: 5 * 60_000 });

function useInvalidar() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: queryKeys.academico });
}

export function useGuardarSesion() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: academicoApi.guardarSesion, onSuccess: invalidar });
}

export function useGuardarCalificaciones() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: academicoApi.guardarCalificaciones, onSuccess: invalidar });
}
