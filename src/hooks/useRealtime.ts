import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { queryKeys } from '@/lib/queryClient';

type QueryKey = readonly string[];

/** Qué datos de la app quedan desactualizados cuando cambia cada tabla. */
const AFECTADOS: Record<string, QueryKey[]> = {
  pagos: [queryKeys.pagos, queryKeys.inscripciones, queryKeys.cursos, queryKeys.dashboard, queryKeys.reportes],
  inscripciones: [queryKeys.inscripciones, queryKeys.pagos, queryKeys.cursos, queryKeys.dashboard, queryKeys.reportes, queryKeys.academico],
  estudiantes: [queryKeys.estudiantes, queryKeys.inscripciones, queryKeys.dashboard, queryKeys.reportes, queryKeys.academico],
};

/**
 * Escucha cambios de otros usuarios (Supabase Realtime) y refresca los datos afectados,
 * incluido el dashboard. Agrupa los avisos que llegan juntos: un pago también actualiza
 * su inscripción, y así se refresca una sola vez.
 */
export function useRealtime(activo: boolean) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!activo) return;
    const pendientes = new Set<QueryKey>();
    let timer: ReturnType<typeof setTimeout> | undefined;

    const programar = (tabla: string) => {
      AFECTADOS[tabla]?.forEach((k) => pendientes.add(k));
      clearTimeout(timer);
      timer = setTimeout(() => {
        pendientes.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
        pendientes.clear();
      }, 600);
    };

    const canal = supabase.channel('cambios-db');
    for (const tabla of Object.keys(AFECTADOS)) {
      canal.on('postgres_changes', { event: '*', schema: 'public', table: tabla }, () => programar(tabla));
    }
    canal.subscribe();

    return () => {
      clearTimeout(timer);
      supabase.removeChannel(canal);
    };
  }, [activo, qc]);
}
