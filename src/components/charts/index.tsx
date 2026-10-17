import {
  Bar, BarChart, CartesianGrid, Cell, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { monedaCompacta, useChartTheme } from '@/lib/chartTheme';
import { formatMoneda } from '@/utils/format';
import { EmptyState } from '@/components/ui';

export interface Punto { nombre: string; valor: number }

const vacio = (d: unknown[]) => d.length === 0 || (d as Punto[]).every((p) => !p.valor);

/** Barras verticales de una sola serie (montos en soles). */
export function GraficoBarras({ data, alto = 280, horizontal = false }: { data: Punto[]; alto?: number; horizontal?: boolean }) {
  const t = useChartTheme();
  if (vacio(data)) return <EmptyState title="Sin datos para el período" />;
  const eje = { stroke: t.texto, fontSize: 11, tickLine: false, axisLine: false } as const;
  return (
    <ResponsiveContainer width="100%" height={horizontal ? Math.max(alto, data.length * 36) : alto}>
      <BarChart data={data} layout={horizontal ? 'vertical' : 'horizontal'} margin={{ top: 8, right: 16, left: 0, bottom: 0 }} barCategoryGap="28%">
        <CartesianGrid stroke={t.grid} vertical={horizontal} horizontal={!horizontal} />
        {horizontal ? (
          <>
            <XAxis type="number" tickFormatter={monedaCompacta} {...eje} />
            <YAxis type="category" dataKey="nombre" width={130} {...eje} tickFormatter={(v: string) => (v.length > 18 ? v.slice(0, 17) + '…' : v)} />
          </>
        ) : (
          <>
            <XAxis dataKey="nombre" {...eje} />
            <YAxis tickFormatter={monedaCompacta} width={64} {...eje} />
          </>
        )}
        <Tooltip formatter={(v: number) => [formatMoneda(v), 'Recaudado']} contentStyle={t.tooltip.contentStyle} cursor={t.tooltip.cursor} />
        <Bar dataKey="valor" fill={t.principal} radius={horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0]} maxBarSize={horizontal ? 22 : 40} />
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Línea de tendencia (una serie) con tooltip tipo crosshair. */
export function GraficoLinea({ data, alto = 280, etiqueta = 'Recaudado' }: { data: Punto[]; alto?: number; etiqueta?: string }) {
  const t = useChartTheme();
  if (vacio(data)) return <EmptyState title="Sin datos para el período" />;
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <LineChart data={data} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid stroke={t.grid} vertical={false} />
        <XAxis dataKey="nombre" stroke={t.texto} fontSize={11} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={monedaCompacta} width={64} stroke={t.texto} fontSize={11} tickLine={false} axisLine={false} />
        <Tooltip formatter={(v: number) => [formatMoneda(v), etiqueta]} contentStyle={t.tooltip.contentStyle} cursor={{ stroke: t.texto, strokeDasharray: '3 3' }} />
        <Line type="monotone" dataKey="valor" stroke={t.principal} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: t.superficie }} activeDot={{ r: 5 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}

/** Pie/dona con leyenda y colores explícitos (estados) o categóricos en orden fijo. */
export function GraficoPie({ data, colores, alto = 260, moneda = true }: { data: Punto[]; colores?: string[]; alto?: number; moneda?: boolean }) {
  const t = useChartTheme();
  if (vacio(data)) return <EmptyState title="Sin datos para el período" />;
  const paleta = colores ?? t.series;
  const total = data.reduce((s, d) => s + d.valor, 0);
  const fmt = (v: number) => (moneda ? formatMoneda(v) : String(v));
  return (
    <ResponsiveContainer width="100%" height={alto}>
      <PieChart>
        <Pie data={data} dataKey="valor" nameKey="nombre" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke={t.superficie} strokeWidth={2}>
          {data.map((_, i) => <Cell key={i} fill={paleta[i % paleta.length]} />)}
        </Pie>
        <Tooltip formatter={(v: number, n: string) => [`${fmt(v)} (${total ? Math.round((v / total) * 100) : 0}%)`, n]} contentStyle={t.tooltip.contentStyle} />
        <Legend
          verticalAlign="bottom"
          iconType="circle"
          iconSize={8}
          formatter={(v: string, entry) => (
            <span style={{ color: t.texto, fontSize: 12 }}>
              {v}: {fmt((entry.payload as unknown as Punto).valor)}
            </span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
