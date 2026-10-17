import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { inscripcionesApi, type InscripcionFiltros } from '@/api/inscripciones.api';
import { queryKeys } from '@/lib/queryClient';
import type { EstadoInscripcion } from '@/types/database';
import type { InscripcionInput } from '@/schemas/inscripcion.schema';

export const useInscripciones = (f: InscripcionFiltros, enabled = true) =>
  useQuery({
    queryKey: [...queryKeys.inscripciones, 'lista', f],
    queryFn: () => inscripcionesApi.listar(f),
    placeholderData: keepPreviousData,
    enabled,
  });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    for (const k of [queryKeys.inscripciones, queryKeys.cursos, queryKeys.dashboard, queryKeys.reportes, queryKeys.pagos]) {
      qc.invalidateQueries({ queryKey: k });
    }
  };
}

export function useCrearInscripcion() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (i: InscripcionInput) => inscripcionesApi.crear(i), onSuccess: invalidar });
}

export function useCambiarEstadoInscripcion() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, estado, observacion }: { id: string; estado: EstadoInscripcion; observacion?: string }) =>
      inscripcionesApi.cambiarEstado(id, estado, observacion),
    onSuccess: invalidar,
  });
}

export function useAnularInscripcion() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: inscripcionesApi.anular, onSuccess: invalidar });
}
