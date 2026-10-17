import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { estudiantesApi, type EstudianteFiltros } from '@/api/estudiantes.api';
import { queryKeys } from '@/lib/queryClient';
import type { EstudianteInput } from '@/schemas/estudiante.schema';

export const useEstudiantes = (f: EstudianteFiltros) =>
  useQuery({
    queryKey: [...queryKeys.estudiantes, 'lista', f],
    queryFn: () => estudiantesApi.listar(f),
    placeholderData: keepPreviousData,
  });

export const useBuscarEstudiantes = (texto: string) =>
  useQuery({
    queryKey: [...queryKeys.estudiantes, 'buscar', texto],
    queryFn: () => estudiantesApi.buscar(texto),
    placeholderData: keepPreviousData,
  });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.estudiantes });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useGuardarEstudiante() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: EstudianteInput }) =>
      id ? estudiantesApi.actualizar(id, input) : estudiantesApi.crear(input),
    onSuccess: invalidar,
  });
}

export function useEliminarEstudiante() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: estudiantesApi.eliminar, onSuccess: invalidar });
}
