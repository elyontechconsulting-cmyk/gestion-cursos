import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profesoresApi, type ProfesorFiltros } from '@/api/profesores.api';
import { queryKeys } from '@/lib/queryClient';
import type { ProfesorInput } from '@/schemas/profesor.schema';

export const useProfesores = (f: ProfesorFiltros) =>
  useQuery({ queryKey: [...queryKeys.profesores, 'lista', f], queryFn: () => profesoresApi.listar(f), placeholderData: keepPreviousData });

export const useProfesoresOpciones = (enabled = true) =>
  useQuery({ queryKey: [...queryKeys.profesores, 'opciones'], queryFn: profesoresApi.opciones, enabled });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.profesores });
    // Los nombres de los profesores se muestran en los cursos
    qc.invalidateQueries({ queryKey: queryKeys.cursos });
  };
}

export function useGuardarProfesor() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: ProfesorInput }) =>
      id ? profesoresApi.actualizar(id, input) : profesoresApi.crear(input),
    onSuccess: invalidar,
  });
}

export function useEliminarProfesor() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: profesoresApi.eliminar, onSuccess: invalidar });
}
