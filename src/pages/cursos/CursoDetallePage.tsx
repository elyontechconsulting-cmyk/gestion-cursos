import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Clock, FileSpreadsheet, FileText, MapPin, Plus, Wallet } from 'lucide-react';
import { useCurso } from '@/hooks/useCursos';
import { useInscripciones } from '@/hooks/useInscripciones';
import { usePermisos } from '@/hooks/usePermisos';
import { inscripcionesApi } from '@/api/inscripciones.api';
import { Button, Card, DataTable, EstadoBadge, PageHeader, PantallaCarga, SearchInput, StatCard, type Column } from '@/components/ui';
import { ESTADOS_CURSO, ESTADOS_INSCRIPCION, ESTADOS_PAGO, MODALIDADES } from '@/lib/constants';
import { formatFecha, formatMoneda } from '@/utils/format';
import { useDebounce } from '@/hooks/useDebounce';
import { exportarExcel, exportarPdf, type ColumnaExport } from '@/services/export.service';
import { notify } from '@/services/notify';
import { InscripcionFormModal } from '@/pages/inscripciones/InscripcionFormModal';
import { PagoFormModal } from '@/pages/pagos/PagoFormModal';
import type { InscripcionDetalle } from '@/types/database';

export default function CursoDetallePage() {
  const { id } = useParams<{ id: string }>();
  const { puede } = usePermisos();
  const { data: curso, isLoading } = useCurso(id);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const debounced = useDebounce(search);
  const lista = useInscripciones({ page, pageSize: 20, search: debounced, cursoId: id }, !!id);
  const [inscribir, setInscribir] = useState(false);
  const [pagar, setPagar] = useState<InscripcionDetalle | null>(null);

  if (isLoading || !curso) return <PantallaCarga />;

  const columnasExport: ColumnaExport<InscripcionDetalle>[] = [
    { header: 'DNI', value: (r) => r.dni, width: 12 },
    { header: 'Estudiante', value: (r) => r.estudiante_nombre, width: 34 },
    { header: 'Correo', value: (r) => r.estudiante_correo, width: 28 },
    { header: 'Teléfono', value: (r) => r.estudiante_telefono, width: 14 },
    { header: 'Inscripción', value: (r) => r.fecha_inscripcion, tipo: 'fecha' },
    { header: 'Estado', value: (r) => ESTADOS_INSCRIPCION[r.estado] },
    { header: 'Pagado', value: (r) => r.total_pagado, tipo: 'moneda' },
    { header: 'Saldo', value: (r) => r.saldo_pendiente, tipo: 'moneda' },
  ];

  const exportar = async (tipo: 'xlsx' | 'pdf') => {
    try {
      const filas = await inscripcionesApi.todas({ cursoId: curso.id });
      const opts = { titulo: `Inscritos · ${curso.nombre}`, subtitulo: curso.codigo, archivo: `inscritos_${curso.codigo}`, columnas: columnasExport, filas };
      await (tipo === 'xlsx' ? exportarExcel(opts) : exportarPdf(opts));
    } catch (e) {
      notify.error(e, 'No se pudo exportar');
    }
  };

  const columnas: Column<InscripcionDetalle>[] = [
    { key: 'est', header: 'Estudiante', cell: (r) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{r.estudiante_nombre}</p><p className="text-xs text-zinc-500">DNI {r.dni}</p></div> },
    { key: 'fecha', header: 'Inscripción', hideOnMobile: true, cell: (r) => formatFecha(r.fecha_inscripcion) },
    { key: 'estado', header: 'Estado', cell: (r) => <EstadoBadge valor={r.estado} etiquetas={ESTADOS_INSCRIPCION} /> },
    { key: 'pago', header: 'Pago', cell: (r) => <EstadoBadge valor={r.estado_pago} etiquetas={ESTADOS_PAGO} /> },
    { key: 'saldo', header: 'Saldo', align: 'right', cell: (r) => <span className={r.saldo_pendiente > 0 ? 'font-medium text-red-600 dark:text-red-400' : ''}>{formatMoneda(r.saldo_pendiente)}</span> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (r) => puede('pagos.crear') && r.saldo_pendiente > 0 && r.estado !== 'retirado'
        ? <Button size="sm" variant="outline" icon={<Wallet className="h-3.5 w-3.5" />} onClick={() => setPagar(r)}>Pagar</Button>
        : null,
    },
  ];

  const ocupados = curso.cupos - curso.cupos_disponibles;

  return (
    <>
      <Link to="/cursos" className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="h-4 w-4" /> Cursos
      </Link>
      <PageHeader
        title={curso.nombre}
        description={`${curso.codigo} · ${MODALIDADES[curso.modalidad]}`}
        actions={
          <>
            <Button variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => exportar('xlsx')}>Excel</Button>
            <Button variant="outline" icon={<FileText className="h-4 w-4" />} onClick={() => exportar('pdf')}>PDF</Button>
            {puede('inscripciones.crear') && ['programado', 'en_ejecucion'].includes(curso.estado) && (
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setInscribir(true)} disabled={curso.cupos_disponibles <= 0}>Inscribir</Button>
            )}
          </>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card title="Información" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between"><dt className="text-zinc-500">Estado</dt><dd><EstadoBadge valor={curso.estado} etiquetas={ESTADOS_CURSO} /></dd></div>
            <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-zinc-400" />{formatFecha(curso.fecha_inicio)} – {formatFecha(curso.fecha_fin)}</div>
            <div className="flex items-center gap-2"><Clock className="h-4 w-4 text-zinc-400" />{curso.horario || 'Sin horario definido'}</div>
            <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-zinc-400" />{MODALIDADES[curso.modalidad]}</div>
            <div className="flex items-center justify-between"><dt className="text-zinc-500">Costo</dt><dd className="font-semibold">{formatMoneda(curso.costo)}</dd></div>
            {curso.descripcion && <p className="border-t border-zinc-100 pt-3 text-zinc-600 dark:border-white/[0.06] dark:text-zinc-400">{curso.descripcion}</p>}
          </dl>
        </Card>
        <div className="grid grid-cols-2 gap-4 lg:col-span-2">
          <StatCard label="Inscritos / cupos" value={`${ocupados} / ${curso.cupos}`} hint={`${curso.cupos_disponibles} disponibles`} icon={<CalendarDays className="h-5 w-5" />} />
          <StatCard label="Pagados" value={curso.pagados} hint={`${curso.pendientes} con saldo`} tono="green" icon={<Wallet className="h-5 w-5" />} />
          <StatCard label="Recaudado" value={formatMoneda(curso.recaudado)} tono="blue" icon={<Wallet className="h-5 w-5" />} />
          <StatCard label="Por cobrar" value={formatMoneda(curso.por_cobrar)} tono="amber" icon={<Wallet className="h-5 w-5" />} />
        </div>
      </div>

      <div className="mb-3 flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Estudiantes inscritos</h2>
        <SearchInput value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Buscar estudiante…" className="w-full max-w-xs" />
      </div>
      <DataTable
        columns={columnas}
        data={lista.data?.data ?? []}
        rowKey={(r) => r.id}
        loading={lista.isLoading}
        fetching={lista.isFetching}
        emptyTitle="Aún no hay inscritos"
        pagination={{ page, pageSize: 20, total: lista.data?.count ?? 0, onPageChange: setPage }}
      />
      <InscripcionFormModal open={inscribir} onClose={() => setInscribir(false)} cursoId={curso.id} />
      <PagoFormModal inscripcion={pagar} onClose={() => setPagar(null)} />
    </>
  );
}
