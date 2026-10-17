import { useState } from 'react';
import { MoreHorizontal, Plus, Trash2, Wallet } from 'lucide-react';
import { useAnularInscripcion, useCambiarEstadoInscripcion, useInscripciones } from '@/hooks/useInscripciones';
import { useCursosOpciones } from '@/hooks/useCursos';
import { usePaginacion } from '@/hooks/usePaginacion';
import { usePermisos } from '@/hooks/usePermisos';
import { Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, Input, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_INSCRIPCION, ESTADOS_PAGO, toOptions } from '@/lib/constants';
import { formatFecha, formatMoneda } from '@/utils/format';
import { notify } from '@/services/notify';
import { InscripcionFormModal } from './InscripcionFormModal';
import { PagoFormModal } from '@/pages/pagos/PagoFormModal';
import type { EstadoInscripcion, EstadoPago, InscripcionDetalle } from '@/types/database';

export default function InscripcionesPage() {
  const { puede } = usePermisos();
  const t = usePaginacion({ cursoId: '', estado: '' as EstadoInscripcion | '', estadoPago: '' as EstadoPago | '', desde: '', hasta: '' });
  const { data, isLoading, isFetching } = useInscripciones(t.params);
  const { data: cursos = [] } = useCursosOpciones(false);
  const cambiarEstado = useCambiarEstadoInscripcion();
  const anular = useAnularInscripcion();
  const [nueva, setNueva] = useState(false);
  const [pagar, setPagar] = useState<InscripcionDetalle | null>(null);

  const onCambiarEstado = async (r: InscripcionDetalle) => {
    const value = await notify.select({ title: 'Cambiar estado', options: ESTADOS_INSCRIPCION, value: r.estado });
    if (!value || value === r.estado) return;
    try {
      await cambiarEstado.mutateAsync({ id: r.id, estado: value as EstadoInscripcion });
      notify.success('Estado actualizado');
    } catch (e) {
      notify.error(e);
    }
  };

  const onAnular = async (r: InscripcionDetalle) => {
    if (!(await notify.confirm({ title: '¿Anular inscripción?', text: `${r.estudiante_nombre} en ${r.curso_nombre}`, confirmText: 'Anular', danger: true }))) return;
    try {
      await anular.mutateAsync(r.id);
      notify.success('Inscripción anulada');
    } catch (e) {
      notify.error(e);
    }
  };

  const columnas: Column<InscripcionDetalle>[] = [
    { key: 'est', header: 'Estudiante', cell: (r) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{r.estudiante_nombre}</p><p className="text-xs text-zinc-500">DNI {r.dni}</p></div> },
    { key: 'curso', header: 'Curso', hideOnMobile: true, cell: (r) => <div className="max-w-[220px] truncate"><p className="truncate">{r.curso_nombre}</p><p className="text-xs text-zinc-500">{r.curso_codigo}</p></div> },
    { key: 'fecha', header: 'Fecha', hideOnMobile: true, cell: (r) => formatFecha(r.fecha_inscripcion) },
    { key: 'estado', header: 'Estado', cell: (r) => <EstadoBadge valor={r.estado} etiquetas={ESTADOS_INSCRIPCION} /> },
    { key: 'pago', header: 'Pago', hideOnMobile: true, cell: (r) => <EstadoBadge valor={r.estado_pago} etiquetas={ESTADOS_PAGO} /> },
    { key: 'total', header: 'Total', align: 'right', hideOnMobile: true, cell: (r) => formatMoneda(r.monto_total) },
    { key: 'saldo', header: 'Saldo', align: 'right', cell: (r) => <span className={r.saldo_pendiente > 0 ? 'font-medium text-red-600 dark:text-red-400' : ''}>{formatMoneda(r.saldo_pendiente)}</span> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (r) => (
        <div className="flex justify-end">
          {puede('pagos.crear') && r.saldo_pendiente > 0 && r.estado !== 'retirado' && (
            <IconAction label="Registrar pago" onClick={() => setPagar(r)}><Wallet className="h-4 w-4" /></IconAction>
          )}
          {puede('inscripciones.crear') && <IconAction label="Cambiar estado" onClick={() => onCambiarEstado(r)}><MoreHorizontal className="h-4 w-4" /></IconAction>}
          {puede('inscripciones.anular') && <IconAction label="Anular" danger onClick={() => onAnular(r)}><Trash2 className="h-4 w-4" /></IconAction>}
        </div>
      ),
    },
  ];

  const activos = Object.values(t.filtros).filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Inscripciones"
        description="Matrícula de estudiantes en cursos con control de cupos"
        actions={puede('inscripciones.crear') && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setNueva(true)}>Nueva inscripción</Button>}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar estudiante, DNI o curso…" activos={activos} onClear={t.limpiarFiltros}>
        <Field label="Curso">
          <Select value={t.filtros.cursoId} onChange={(e) => t.setFiltro('cursoId', e.target.value)}>
            <option value="">Todos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={t.filtros.estado} onChange={(e) => t.setFiltro('estado', e.target.value as EstadoInscripcion | '')}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_INSCRIPCION).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Estado de pago">
          <Select value={t.filtros.estadoPago} onChange={(e) => t.setFiltro('estadoPago', e.target.value as EstadoPago | '')}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_PAGO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-2">
          <Field label="Desde"><Input type="date" value={t.filtros.desde} onChange={(e) => t.setFiltro('desde', e.target.value)} /></Field>
          <Field label="Hasta"><Input type="date" value={t.filtros.hasta} onChange={(e) => t.setFiltro('hasta', e.target.value)} /></Field>
        </div>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        fetching={isFetching}
        emptyTitle="No hay inscripciones"
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <InscripcionFormModal open={nueva} onClose={() => setNueva(false)} />
      <PagoFormModal inscripcion={pagar} onClose={() => setPagar(null)} />
    </>
  );
}
