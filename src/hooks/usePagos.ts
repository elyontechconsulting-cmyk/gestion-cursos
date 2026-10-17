import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { pagosApi, type PagoFiltros } from '@/api/pagos.api';
import { queryKeys } from '@/lib/queryClient';
import type { PagoInput } from '@/schemas/pago.schema';

export const usePagos = (f: PagoFiltros) =>
  useQuery({ queryKey: [...queryKeys.pagos, 'lista', f], queryFn: () => pagosApi.listar(f), placeholderData: keepPreviousData });

export const useHistorialPagos = (inscripcionId?: string) =>
  useQuery({
    queryKey: [...queryKeys.pagos, 'historial', inscripcionId],
    queryFn: () => pagosApi.historial(inscripcionId!),
    enabled: !!inscripcionId,
  });

function useInvalidar() {
  const qc = useQueryClient();
  return () => {
    for (const k of [queryKeys.pagos, queryKeys.inscripciones, queryKeys.cursos, queryKeys.dashboard, queryKeys.reportes]) {
      qc.invalidateQueries({ queryKey: k });
    }
  };
}

export function useRegistrarPago() {
  const invalidar = useInvalidar();
  return useMutation({ mutationFn: (p: PagoInput) => pagosApi.registrar(p), onSuccess: invalidar });
}

export function useAnularPago() {
  const invalidar = useInvalidar();
  return useMutation({
    mutationFn: ({ id, motivo }: { id: string; motivo: string }) => pagosApi.anular(id, motivo),
    onSuccess: invalidar,
  });
}
