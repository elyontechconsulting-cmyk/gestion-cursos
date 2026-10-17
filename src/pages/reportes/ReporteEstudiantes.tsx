import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { inscripcionesApi } from '@/api/inscripciones.api';
import { useCursosOpciones } from '@/hooks/useCursos';
import { queryKeys } from '@/lib/queryClient';
import { DataTable, EstadoBadge, Field, Input, Select, type Column } from '@/components/ui';
import { ExportButtons } from '@/components/reportes/ExportButtons';
import { ESTADOS_INSCRIPCION, ESTADOS_PAGO, toOptions } from '@/lib/constants';
import { exportarExcel, exportarPdf, type ColumnaExport } from '@/services/export.service';
import { formatFecha, formatMoneda } from '@/utils/format';
import type { EstadoInscripcion, InscripcionDetalle } from '@/types/database';

const POR_PAGINA = 20;

export function ReporteEstudiantes() {
  const [f, setF] = useState({ cursoId: '', estado: '' as EstadoInscripcion | '', desde: '', hasta: '' });
  const [page, setPage] = useState(1);
  const { data: cursos = [] } = useCursosOpciones(false);
  const { data = [], isLoading } = useQuery({
    queryKey: [...queryKeys.reportes, 'estudiantes', f],
    queryFn: () => inscripcionesApi.todas({ cursoId: f.cursoId || undefined, estado: f.estado, desde: f.desde || undefined, hasta: f.hasta || undefined }),
  });
  const set = (k: keyof typeof f, v: string) => { setF({ ...f, [k]: v }); setPage(1); };

  const columnasExport: ColumnaExport<InscripcionDetalle>[] = [
    { header: 'DNI', value: (r) => r.dni, width: 11 },
    { header: 'Estudiante', value: (r) => r.estudiante_nombre, width: 32 },
    { header: 'Correo', value: (r) => r.estudiante_correo, width: 28 },
    { header: 'Teléfono', value: (r) => r.estudiante_telefono, width: 13 },
    { header: 'Curso', value: (r) => r.curso_nombre, width: 30 },
    { header: 'Fecha', value: (r) => r.fecha_inscripcion, tipo: 'fecha' },
    { header: 'Estado', value: (r) => ESTADOS_INSCRIPCION[r.estado] },
    { header: 'Pago', value: (r) => ESTADOS_PAGO[r.estado_pago] },
    { header: 'Saldo', value: (r) => r.saldo_pendiente, tipo: 'moneda' },
  ];
  const curso = cursos.find((c) => c.id === f.cursoId);
  const subtitulo = [curso?.nombre, f.estado && ESTADOS_INSCRIPCION[f.estado], f.desde && `desde ${formatFecha(f.desde)}`, f.hasta && `hasta ${formatFecha(f.hasta)}`].filter(Boolean).join(' · ') || 'Todos';
  const opts = { titulo: 'Reporte de estudiantes', subtitulo, archivo: 'reporte_estudiantes', columnas: columnasExport, filas: data };

  const columnas: Column<InscripcionDetalle>[] = [
    { key: 'e', header: 'Estudiante', cell: (r) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{r.estudiante_nombre}</p><p className="text-xs text-zinc-500">DNI {r.dni}</p></div> },
    { key: 'c', header: 'Curso', cell: (r) => <span className="block max-w-[220px] truncate">{r.curso_nombre}</span> },
    { key: 'f', header: 'Fecha', hideOnMobile: true, cell: (r) => formatFecha(r.fecha_inscripcion) },
    { key: 's', header: 'Estado', cell: (r) => <EstadoBadge valor={r.estado} etiquetas={ESTADOS_INSCRIPCION} /> },
    { key: 'p', header: 'Pago', hideOnMobile: true, cell: (r) => <EstadoBadge valor={r.estado_pago} etiquetas={ESTADOS_PAGO} /> },
    { key: 'sa', header: 'Saldo', align: 'right', cell: (r) => formatMoneda(r.saldo_pendiente) },
  ];

  return (
    <div className="space-y-4">
      <div className="card grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-5 lg:items-end">
        <Field label="Curso" className="lg:col-span-2">
          <Select value={f.cursoId} onChange={(e) => set('cursoId', e.target.value)}>
            <option value="">Todos</option>
            {cursos.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Estado">
          <Select value={f.estado} onChange={(e) => set('estado', e.target.value)}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_INSCRIPCION).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Fecha desde"><Input type="date" value={f.desde} onChange={(e) => set('desde', e.target.value)} /></Field>
        <Field label="Fecha hasta"><Input type="date" value={f.hasta} onChange={(e) => set('hasta', e.target.value)} /></Field>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500">{data.length} registro(s)</p>
        <ExportButtons disabled={!data.length} onExcel={() => exportarExcel(opts)} onPdf={() => exportarPdf(opts)} />
      </div>
      <DataTable
        columns={columnas}
        data={data.slice((page - 1) * POR_PAGINA, page * POR_PAGINA)}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyTitle="Sin resultados"
        pagination={{ page, pageSize: POR_PAGINA, total: data.length, onPageChange: setPage }}
      />
    </div>
  );
}
