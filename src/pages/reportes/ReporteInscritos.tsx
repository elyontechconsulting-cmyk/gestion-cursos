import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { cursosApi } from '@/api/cursos.api';
import { useCursosOpciones } from '@/hooks/useCursos';
import { queryKeys } from '@/lib/queryClient';
import { Card, DataTable, Field, Input, Select, type Column } from '@/components/ui';
import { GraficoBarras } from '@/components/charts';
import { ExportButtons } from '@/components/reportes/ExportButtons';
import { exportarExcel, exportarPdf, type ColumnaExport } from '@/services/export.service';
import { formatFecha, formatMoneda, formatNumero } from '@/utils/format';
import type { CursoResumen } from '@/types/database';

export function ReporteInscritos() {
  const [f, setF] = useState({ cursoId: '', desde: '', hasta: '' });
  const { data: opciones = [] } = useCursosOpciones(false);
  const { data, isLoading } = useQuery({
    queryKey: [...queryKeys.reportes, 'inscritos', f.desde, f.hasta],
    queryFn: () => cursosApi.listar({ page: 1, pageSize: 1000, desde: f.desde || undefined, hasta: f.hasta || undefined }),
  });
  const filas = (data?.data ?? []).filter((c) => !f.cursoId || c.id === f.cursoId);
  const tot = filas.reduce(
    (a, c) => ({ inscritos: a.inscritos + c.inscritos, pagados: a.pagados + c.pagados, pendientes: a.pendientes + c.pendientes, ingresos: a.ingresos + Number(c.recaudado) }),
    { inscritos: 0, pagados: 0, pendientes: 0, ingresos: 0 },
  );

  const columnasExport: ColumnaExport<CursoResumen>[] = [
    { header: 'Código', value: (c) => c.codigo },
    { header: 'Curso', value: (c) => c.nombre, width: 36 },
    { header: 'Inicio', value: (c) => c.fecha_inicio, tipo: 'fecha' },
    { header: 'Cantidad inscritos', value: (c) => c.inscritos, tipo: 'numero' },
    { header: 'Cantidad pagados', value: (c) => c.pagados, tipo: 'numero' },
    { header: 'Cantidad pendientes', value: (c) => c.pendientes, tipo: 'numero' },
    { header: 'Ingresos generados', value: (c) => c.recaudado, tipo: 'moneda', width: 20 },
  ];
  const subtitulo = [f.desde && `Desde ${formatFecha(f.desde)}`, f.hasta && `Hasta ${formatFecha(f.hasta)}`].filter(Boolean).join(' · ') || 'Todos los cursos';
  const opts = {
    titulo: 'Reporte de inscritos por curso', subtitulo, archivo: 'reporte_inscritos', columnas: columnasExport, filas,
    totales: { 2: 'TOTAL', 3: tot.inscritos, 4: tot.pagados, 5: tot.pendientes, 6: tot.ingresos },
  };

  const columnas: Column<CursoResumen>[] = [
    { key: 'c', header: 'Curso', cell: (c) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</p><p className="text-xs text-zinc-500">{c.codigo} · {formatFecha(c.fecha_inicio)}</p></div> },
    { key: 'i', header: 'Inscritos', align: 'right', cell: (c) => formatNumero(c.inscritos) },
    { key: 'p', header: 'Pagados', align: 'right', cell: (c) => formatNumero(c.pagados) },
    { key: 'pe', header: 'Pendientes', align: 'right', cell: (c) => formatNumero(c.pendientes) },
    { key: 'g', header: 'Ingresos generados', align: 'right', cell: (c) => <span className="font-medium">{formatMoneda(c.recaudado)}</span> },
  ];

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 lg:flex-row lg:items-end">
        <Field label="Curso" className="lg:w-72">
          <Select value={f.cursoId} onChange={(e) => setF({ ...f, cursoId: e.target.value })}>
            <option value="">Todos</option>
            {opciones.map((c) => <option key={c.id} value={c.id}>{c.codigo} · {c.nombre}</option>)}
          </Select>
        </Field>
        <Field label="Fecha inicio (desde)"><Input type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></Field>
        <Field label="Fecha fin (hasta)"><Input type="date" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></Field>
        <div className="lg:ml-auto"><ExportButtons disabled={!filas.length} onExcel={() => exportarExcel(opts)} onPdf={() => exportarPdf(opts)} /></div>
      </div>
      <DataTable
        columns={columnas}
        data={filas}
        rowKey={(c) => c.id}
        loading={isLoading}
        emptyTitle="No hay cursos en el rango"
        footer={
          <tr className="font-semibold">
            <td className="td">Total</td>
            <td className="td text-right">{formatNumero(tot.inscritos)}</td>
            <td className="td text-right">{formatNumero(tot.pagados)}</td>
            <td className="td text-right">{formatNumero(tot.pendientes)}</td>
            <td className="td text-right">{formatMoneda(tot.ingresos)}</td>
          </tr>
        }
      />
      <Card title="Ingresos generados por curso">
        <GraficoBarras horizontal data={filas.filter((c) => Number(c.recaudado) > 0).map((c) => ({ nombre: c.nombre, valor: Number(c.recaudado) }))} />
      </Card>
    </div>
  );
}
