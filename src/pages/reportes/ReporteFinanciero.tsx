import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CircleDollarSign, Clock, Receipt } from 'lucide-react';
import { pagosApi } from '@/api/pagos.api';
import { inscripcionesApi } from '@/api/inscripciones.api';
import { queryKeys } from '@/lib/queryClient';
import { ESTADO_COLOR } from '@/lib/chartTheme';
import { MEDIOS_PAGO } from '@/lib/constants';
import { Card, Field, Input, Skeleton, StatCard } from '@/components/ui';
import { GraficoBarras, GraficoLinea, GraficoPie } from '@/components/charts';
import { ExportButtons } from '@/components/reportes/ExportButtons';
import { exportarExcel, exportarPdf } from '@/services/export.service';
import { formatFecha, formatMes, formatMoneda, formatNumero, hoyISO } from '@/utils/format';
import { sumarDias } from '@/utils/date';

interface FilaResumen { concepto: string; cantidad: number; monto: number }

export function ReporteFinanciero() {
  const [f, setF] = useState({ desde: sumarDias(hoyISO(), -180).slice(0, 8) + '01', hasta: hoyISO() });
  const pagos = useQuery({ queryKey: [...queryKeys.reportes, 'pagos', f], queryFn: () => pagosApi.todos(f) });
  const inscripciones = useQuery({ queryKey: [...queryKeys.reportes, 'inscripciones-saldo'], queryFn: () => inscripcionesApi.todas() });

  const d = useMemo(() => {
    const lista = pagos.data ?? [];
    const porMes = new Map<string, number>();
    const porCurso = new Map<string, number>();
    const porMedio = new Map<string, number>();
    for (const p of lista) {
      const mes = p.fecha_pago.slice(0, 7);
      porMes.set(mes, (porMes.get(mes) ?? 0) + Number(p.monto));
      porCurso.set(p.curso_nombre, (porCurso.get(p.curso_nombre) ?? 0) + Number(p.monto));
      porMedio.set(MEDIOS_PAGO[p.medio_pago], (porMedio.get(MEDIOS_PAGO[p.medio_pago]) ?? 0) + Number(p.monto));
    }
    const activas = (inscripciones.data ?? []).filter((i) => i.estado !== 'retirado');
    const conteo = { pagado: 0, parcial: 0, pendiente: 0 };
    let porCobrar = 0;
    for (const i of activas) {
      conteo[i.estado_pago]++;
      porCobrar += Number(i.saldo_pendiente);
    }
    return {
      total: lista.reduce((s, p) => s + Number(p.monto), 0),
      cantidad: lista.length,
      porCobrar,
      conteo,
      mes: [...porMes.entries()].sort().map(([k, v]) => ({ nombre: formatMes(`${k}-01`), valor: v, clave: k })),
      curso: [...porCurso.entries()].sort((a, b) => b[1] - a[1]).map(([nombre, valor]) => ({ nombre, valor })),
      medio: [...porMedio.entries()].sort((a, b) => b[1] - a[1]).map(([nombre, valor]) => ({ nombre, valor })),
    };
  }, [pagos.data, inscripciones.data]);

  const cargando = pagos.isLoading || inscripciones.isLoading;
  const subtitulo = `Del ${formatFecha(f.desde)} al ${formatFecha(f.hasta)}`;

  const filasResumen: FilaResumen[] = [
    ...d.mes.map((m) => ({ concepto: `Recaudación ${m.nombre}`, cantidad: 0, monto: m.valor })),
    ...d.curso.map((c) => ({ concepto: `Curso: ${c.nombre}`, cantidad: 0, monto: c.valor })),
    { concepto: 'Pagos realizados (período)', cantidad: d.cantidad, monto: d.total },
    { concepto: 'Inscripciones con saldo pendiente', cantidad: d.conteo.pendiente + d.conteo.parcial, monto: d.porCobrar },
  ];
  const opts = {
    titulo: 'Reporte financiero', subtitulo, archivo: 'reporte_financiero', orientacion: 'portrait' as const, filas: filasResumen,
    columnas: [
      { header: 'Concepto', value: (r: FilaResumen) => r.concepto, width: 48 },
      { header: 'Cantidad', value: (r: FilaResumen) => (r.cantidad || ''), width: 12 },
      { header: 'Monto', value: (r: FilaResumen) => r.monto, tipo: 'moneda' as const, width: 18 },
    ],
  };

  return (
    <div className="space-y-4">
      <div className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-end">
        <Field label="Desde"><Input type="date" value={f.desde} onChange={(e) => setF({ ...f, desde: e.target.value })} /></Field>
        <Field label="Hasta"><Input type="date" value={f.hasta} onChange={(e) => setF({ ...f, hasta: e.target.value })} /></Field>
        <div className="sm:ml-auto"><ExportButtons disabled={cargando} onExcel={() => exportarExcel(opts)} onPdf={() => exportarPdf(opts)} /></div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {cargando ? [1, 2, 3].map((i) => <Skeleton key={i} className="h-[76px] rounded-xl" />) : (
          <>
            <StatCard label="Pagos realizados" value={formatMoneda(d.total)} hint={`${formatNumero(d.cantidad)} pagos en el período`} tono="green" icon={<CircleDollarSign className="h-5 w-5" />} />
            <StatCard label="Pagos pendientes" value={formatMoneda(d.porCobrar)} hint={`${d.conteo.pendiente + d.conteo.parcial} inscripciones con saldo`} tono="red" icon={<Clock className="h-5 w-5" />} />
            <StatCard label="Ticket promedio" value={formatMoneda(d.cantidad ? d.total / d.cantidad : 0)} tono="blue" icon={<Receipt className="h-5 w-5" />} />
          </>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Recaudación por mes" description="Tendencia (línea)">
          {cargando ? <Skeleton className="h-[280px]" /> : <GraficoLinea data={d.mes} />}
        </Card>
        <Card title="Recaudación por mes" description="Comparativo (barras)">
          {cargando ? <Skeleton className="h-[280px]" /> : <GraficoBarras data={d.mes} />}
        </Card>
        <Card title="Recaudación por curso">
          {cargando ? <Skeleton className="h-[280px]" /> : <GraficoBarras horizontal data={d.curso.slice(0, 10)} />}
        </Card>
        <Card title="Estado de pagos" description="Inscripciones vigentes por estado">
          {cargando ? <Skeleton className="h-[260px]" /> : (
            <GraficoPie
              moneda={false}
              data={[
                { nombre: 'Pagado', valor: d.conteo.pagado },
                { nombre: 'Parcial', valor: d.conteo.parcial },
                { nombre: 'Pendiente', valor: d.conteo.pendiente },
              ]}
              colores={[ESTADO_COLOR.pagado, ESTADO_COLOR.parcial, ESTADO_COLOR.pendiente]}
            />
          )}
        </Card>
        <Card title="Recaudación por medio de pago" className="lg:col-span-2">
          {cargando ? <Skeleton className="h-[260px]" /> : <GraficoPie data={d.medio} />}
        </Card>
      </div>
    </div>
  );
}
