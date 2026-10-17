import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { configuracionApi } from '@/api/configuracion.api';
import { queryKeys } from '@/lib/queryClient';
import type { ConfiguracionInput } from '@/schemas/configuracion.schema';

export const useConfiguracion = () =>
  useQuery({ queryKey: queryKeys.configuracion, queryFn: configuracionApi.obtener });

export function useGuardarConfiguracion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ConfiguracionInput) => configuracionApi.actualizar(input),
    onSuccess: (data) => qc.setQueryData(queryKeys.configuracion, data),
  });
}
