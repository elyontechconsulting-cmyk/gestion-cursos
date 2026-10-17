import { useState } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { auditoriaApi } from '@/api/usuarios.api';
import { queryKeys } from '@/lib/queryClient';
import { usePaginacion } from '@/hooks/usePaginacion';
import { Badge, DataTable, Field, FilterBar, IconAction, Input, Modal, PageHeader, Select, type Column } from '@/components/ui';
import { formatFechaHora } from '@/utils/format';
import type { Auditoria } from '@/types/database';

const TABLAS = ['cursos', 'estudiantes', 'inscripciones', 'pagos', 'usuarios'];
const TONO = { INSERT: 'green', UPDATE: 'blue', DELETE: 'red' } as const;
const ACCION = { INSERT: 'Creación', UPDATE: 'Modificación', DELETE: 'Eliminación' } as const;

export default function AuditoriaPage() {
  const t = usePaginacion({ tabla: '', accion: '', desde: '', hasta: '' }, 20);
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.auditoria, t.params],
    queryFn: () => auditoriaApi.listar(t.params),
    placeholderData: keepPreviousData,
  });
  const [detalle, setDetalle] = useState<Auditoria | null>(null);

  const columnas: Column<Auditoria>[] = [
    { key: 'f', header: 'Fecha', cell: (a) => <span className="text-xs">{formatFechaHora(a.fecha)}</span> },
    { key: 'u', header: 'Usuario', cell: (a) => a.usuario_email ?? <span className="text-zinc-400">sistema</span> },
    { key: 'a', header: 'Acción', cell: (a) => <Badge tono={TONO[a.accion]}>{ACCION[a.accion]}</Badge> },
    { key: 't', header: 'Tabla', cell: (a) => <span className="font-mono text-xs">{a.tabla}</span> },
    { key: 'r', header: 'Registro', hideOnMobile: true, cell: (a) => <span className="font-mono text-xs text-zinc-500">{a.registro_id.slice(0, 8)}…</span> },
    { key: 'v', header: '', align: 'right', cell: (a) => <IconAction label="Ver cambios" onClick={() => setDetalle(a)}><Eye className="h-4 w-4" /></IconAction> },
  ];

  return (
    <>
      <PageHeader title="Auditoría" description="Registro inalterable de creaciones, modificaciones y eliminaciones" />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar por usuario o ID de registro…" activos={Object.values(t.filtros).filter(Boolean).length} onClear={t.limpiarFiltros}>
        <Field label="Tabla">
          <Select value={t.filtros.tabla} onChange={(e) => t.setFiltro('tabla', e.target.value)}>
            <option value="">Todas</option>
            {TABLAS.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </Field>
        <Field label="Acción">
          <Select value={t.filtros.accion} onChange={(e) => t.setFiltro('accion', e.target.value)}>
            <option value="">Todas</option>
            {Object.entries(ACCION).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </Field>
        <Field label="Desde"><Input type="date" value={t.filtros.desde} onChange={(e) => t.setFiltro('desde', e.target.value)} /></Field>
        <Field label="Hasta"><Input type="date" value={t.filtros.hasta} onChange={(e) => t.setFiltro('hasta', e.target.value)} /></Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(a) => String(a.id)}
        loading={isLoading}
        fetching={isFetching}
        onRowClick={setDetalle}
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <Modal open={!!detalle} onClose={() => setDetalle(null)} title="Detalle del cambio" description={detalle ? `${detalle.tabla} · ${formatFechaHora(detalle.fecha)}` : ''} size="xl">
        {detalle && <Diferencias antes={detalle.datos_anteriores} despues={detalle.datos_nuevos} />}
      </Modal>
    </>
  );
}

function Diferencias({ antes, despues }: { antes: Record<string, unknown> | null; despues: Record<string, unknown> | null }) {
  const claves = [...new Set([...Object.keys(antes ?? {}), ...Object.keys(despues ?? {})])].filter((k) => k !== 'updated_at');
  const fmt = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead><tr><th className="th">Campo</th><th className="th">Antes</th><th className="th">Después</th></tr></thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-white/[0.05]">
          {claves.map((k) => {
            const a = fmt(antes?.[k]);
            const d = fmt(despues?.[k]);
            const cambio = antes && despues && a !== d;
            return (
              <tr key={k} className={cambio ? 'bg-amber-50 dark:bg-amber-500/10' : ''}>
                <td className="td font-mono text-xs">{k}</td>
                <td className="td max-w-xs truncate text-xs">{a}</td>
                <td className="td max-w-xs truncate text-xs">{d}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
