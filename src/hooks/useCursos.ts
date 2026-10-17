import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { cursosApi, type CursoFiltros } from '@/api/cursos.api';
import { queryKeys } from '@/lib/queryClient';
import type { CursoInput } from '@/schemas/curso.schema';

export const useCursos = (f: CursoFiltros) =>
  useQuery({ queryKey: [...queryKeys.cursos, 'lista', f], queryFn: () => cursosApi.listar(f), placeholderData: keepPreviousData });

export const useCursosOpciones = (soloAbiertos = true) =>
  useQuery({ queryKey: [...queryKeys.cursos, 'opciones', soloAbiertos], queryFn: () => cursosApi.opciones(soloAbiertos) });

export const useCurso = (id?: string) =>
  useQuery({ queryKey: [...queryKeys.cursos, id], queryFn: () => cursosApi.obtener(id!), enabled: !!id });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: queryKeys.cursos });
    qc.invalidateQueries({ queryKey: queryKeys.dashboard });
  };
}

export function useGuardarCurso() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: CursoInput }) =>
      id ? cursosApi.actualizar(id, input) : cursosApi.crear(input),
    onSuccess: invalidar,
  });
}

export function useEliminarCurso() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: cursosApi.eliminar, onSuccess: invalidar });
}

export function useDuplicarCurso() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: cursosApi.duplicar, onSuccess: invalidar });
}
