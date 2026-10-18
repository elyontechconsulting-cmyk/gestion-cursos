import { useState } from 'react';
import { Ban, FileSpreadsheet, Printer, Wallet } from 'lucide-react';
import { usePagos, useAnularPago } from '@/hooks/usePagos';
import { useInscripciones } from '@/hooks/useInscripciones';
import { useCursosOpciones } from '@/hooks/useCursos';
import { usePaginacion } from '@/hooks/usePaginacion';
import { usePermisos } from '@/hooks/usePermisos';
import { pagosApi } from '@/api/pagos.api';
import { Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, Input, MultiSelect, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_PAGO, MEDIOS_PAGO, toOptions } from '@/lib/constants';
import { formatFecha, formatMoneda } from '@/utils/format';
import { notify } from '@/services/notify';
import { exportarExcel } from '@/services/export.service';
import { formatNumeroRecibo, reimprimir } from '@/services/recibo.service';
import { PagoFormModal } from './PagoFormModal';
import { cn } from '@/utils/cn';
import type { EstadoPago, InscripcionDetalle, MedioPago, PagoDetalle } from '@/types/database';

export default function PagosPage() {
  const [tab, setTab] = useState<'saldos' | 'historial'>('saldos');
  return (
    <>
      <PageHeader title="Pagos" description="Cobranza, saldos pendientes e historial de pagos" />
      <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-white/[0.05]">
        {(['saldos', 'historial'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('rounded-md px-3 py-1.5 font-medium transition', tab === t ? 'bg-white shadow-sm dark:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100')}
          >
            {t === 'saldos' ? 'Saldos por inscripción' : 'Historial de pagos'}
          </button>
        ))}
      </div>
      {tab === 'saldos' ? <TabSaldos /> : <TabHistorial />}
    </>
  );
}

function TabSaldos() {
  const { puede } = usePermisos();
  // Por defecto: lo que aún tiene saldo (Pendiente y Parcial)
  const t = usePaginacion({ estadoPago: ['pendiente', 'parcial'] as EstadoPago[], cursoId: '' });
  // "Todos" (ninguno o los tres marcados) no cuenta como filtro activo
  const filtraEstado = t.filtros.estadoPago.length > 0 && t.filtros.estadoPago.length < Object.keys(ESTADOS_PAGO).length;
  const { data, isLoading, isFetching } = useInscripciones(t.params);
  const { data: cursos = [] } = useCursosOpciones(false);
  const [pagar, setPagar] = useState<InscripcionDetalle | null>(null);

  const columnas: Column<InscripcionDetalle>[] = [
    { key: 'est', header: 'Estudiante', cell: (r) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{r.estudiante_nombre}</p><p className="text-xs text-zinc-500">DNI {r.dni}</p></div> },
    { key: 'curso', header: 'Curso', hideOnMobile: true, cell: (r) => <span className="block max-w-[220px] truncate">{r.curso_nombre}</span> },
    { key: 'total', header: 'Total', align: 'right', hideOnMobile: true, cell: (r) => formatMoneda(r.monto_total) },
    { key: 'pagado', header: 'Pagado', align: 'right', hideOnMobile: true, cell: (r) => formatMoneda(r.total_pagado) },
    { key: 'saldo', header: 'Saldo', align: 'right', cell: (r) => <span className={r.saldo_pendiente > 0 ? 'font-semibold text-red-600 dark:text-red-400' : ''}>{formatMoneda(r.saldo_pendiente)}</span> },
    { key: 'estado', header: 'Estado', cell: (r) => <EstadoBadge valor={r.estado_pago} etiquetas={ESTADOS_PAGO} /> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (r) => (
        <Button size="sm" variant={r.saldo_pendiente > 0 && puede('pagos.crear') ? 'primary' : 'outline'} icon={<Wallet className="h-3.5 w-3.5" />} onClick={() => setPagar(r)}>
          {r.saldo_pendiente > 0 && puede('pagos.crear') ? 'Pagar' : 'Ver'}
        </Button>
      ),
    },
  ];

  return (
    <>
      <FilterBar
        search={t.search} onSearch={t.setSearch} placeholder="Buscar estudiante, DNI o curso…"
        activos={(filtraEstado ? 1 : 0) + (t.filtros.cursoId ? 1 : 0)} onClear={t.limpiarFiltros}
      >
        <Field label="Estado de pago">
          <MultiSelect
            options={toOptions(ESTADOS_PAGO)}
            value={t.filtros.estadoPago}
            onChange={(v) => t.setFiltro('estadoPago', v)}
          />
        </Field>
        <Field label="Curso">
          <Select value={t.filtros.cursoId} onChange={(e) => t.setFiltro('cursoId', e.target.value)}>
            <option value="">Todos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
          </Select>
        </Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        fetching={isFetching}
        emptyTitle="No hay saldos con este filtro"
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <PagoFormModal inscripcion={pagar} onClose={() => setPagar(null)} />
    </>
  );
}

function TabHistorial() {
  const { puede } = usePermisos();
  const t = usePaginacion({ medio: '' as MedioPago | '', cursoId: '', desde: '', hasta: '' });
  const { data, isLoading, isFetching } = usePagos(t.params);
  const { data: cursos = [] } = useCursosOpciones(false);
  const anular = useAnularPago();

  const onAnular = async (p: PagoDetalle) => {
    const motivo = await notify.prompt({ title: 'Anular pago', label: `${formatMoneda(p.monto)} · ${p.estudiante_nombre}`, placeholder: 'Motivo de anulación', required: true });
    if (!motivo) return;
    try {
      await anular.mutateAsync({ id: p.id, motivo });
      notify.success('Pago anulado');
    } catch (e) {
      notify.error(e);
    }
  };

  const exportar = async () => {
    try {
      const filas = await pagosApi.todos({ cursoId: t.filtros.cursoId || undefined, desde: t.filtros.desde || undefined, hasta: t.filtros.hasta || undefined });
      await exportarExcel({
        titulo: 'Historial de pagos',
        archivo: 'pagos',
        filas,
        columnas: [
          { header: 'Recibo', value: (r) => formatNumeroRecibo(r.numero_recibo) },
          { header: 'Fecha', value: (r) => r.fecha_pago, tipo: 'fecha' },
          { header: 'DNI', value: (r) => r.dni },
          { header: 'Estudiante', value: (r) => r.estudiante_nombre, width: 32 },
          { header: 'Curso', value: (r) => r.curso_nombre, width: 30 },
          { header: 'Medio', value: (r) => MEDIOS_PAGO[r.medio_pago] },
          { header: 'N.° operación', value: (r) => r.numero_operacion, width: 16 },
          { header: 'Monto', value: (r) => r.monto, tipo: 'moneda' },
          { header: 'Registrado por', value: (r) => r.registrado_por, width: 26 },
        ],
        totales: { 6: 'TOTAL', 7: filas.reduce((s, r) => s + Number(r.monto), 0) },
      });
    } catch (e) {
      notify.error(e, 'No se pudo exportar');
    }
  };

  const columnas: Column<PagoDetalle>[] = [
    { key: 'recibo', header: 'Recibo', hideOnMobile: true, cell: (p) => <span className="font-mono text-xs">{formatNumeroRecibo(p.numero_recibo)}</span> },
    { key: 'fecha', header: 'Fecha', cell: (p) => formatFecha(p.fecha_pago) },
    { key: 'est', header: 'Estudiante', cell: (p) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{p.estudiante_nombre}</p><p className="text-xs text-zinc-500">{p.curso_codigo}</p></div> },
    { key: 'medio', header: 'Medio', cell: (p) => MEDIOS_PAGO[p.medio_pago] },
    { key: 'op', header: 'N.° operación', hideOnMobile: true, cell: (p) => p.numero_operacion ?? '—' },
    { key: 'monto', header: 'Monto', align: 'right', cell: (p) => <span className="font-medium">{formatMoneda(p.monto)}</span> },
    { key: 'por', header: 'Registrado por', hideOnMobile: true, cell: (p) => <span className="text-xs">{p.registrado_por ?? '—'}</span> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (p) => (
        <div className="flex justify-end gap-1">
          <IconAction label="Reimprimir recibo" onClick={() => reimprimir(p.id, p.inscripcion_id)}><Printer className="h-4 w-4" /></IconAction>
          {puede('pagos.anular') && <IconAction label="Anular pago" danger onClick={() => onAnular(p)}><Ban className="h-4 w-4" /></IconAction>}
        </div>
      ),
    },
  ];

  return (
    <>
      <FilterBar
        search={t.search} onSearch={t.setSearch} placeholder="Buscar estudiante, curso u operación…"
        activos={Object.values(t.filtros).filter(Boolean).length} onClear={t.limpiarFiltros}
        extra={<Button variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={exportar}>Excel</Button>}
      >
        <Field label="Medio de pago">
          <Select value={t.filtros.medio} onChange={(e) => t.setFiltro('medio', e.target.value as MedioPago | '')}>
            <option value="">Todos</option>
            {toOptions(MEDIOS_PAGO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Curso">
          <Select value={t.filtros.cursoId} onChange={(e) => t.setFiltro('cursoId', e.target.value)}>
            <option value="">Todos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Desde"><Input type="date" value={t.filtros.desde} onChange={(e) => t.setFiltro('desde', e.target.value)} /></Field>
        <Field label="Hasta"><Input type="date" value={t.filtros.hasta} onChange={(e) => t.setFiltro('hasta', e.target.value)} /></Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        fetching={isFetching}
        emptyTitle="No hay pagos registrados"
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
    </>
  );
}
