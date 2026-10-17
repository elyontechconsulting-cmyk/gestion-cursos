import { useQuery } from '@tanstack/react-query';
import { BookOpen, CircleDollarSign, ClipboardList, Clock, PlayCircle, Users } from 'lucide-react';
import { dashboardApi } from '@/api/dashboard.api';
import { cursosApi } from '@/api/cursos.api';
import { queryKeys } from '@/lib/queryClient';
import { ESTADO_COLOR } from '@/lib/chartTheme';
import { Card, PageHeader, Skeleton, StatCard } from '@/components/ui';
import { GraficoBarras, GraficoLinea, GraficoPie } from '@/components/charts';
import { formatMes, formatMoneda, formatNumero, hoyISO } from '@/utils/format';
import { sumarDias } from '@/utils/date';
import { useAuth } from '@/contexts/AuthContext';

export default function DashboardPage() {
  const { perfil } = useAuth();
  const resumen = useQuery({ queryKey: [...queryKeys.dashboard, 'resumen'], queryFn: dashboardApi.resumen });
  const desde = sumarDias(hoyISO(), -365).slice(0, 8) + '01';
  const mensual = useQuery({ queryKey: [...queryKeys.dashboard, 'mensual', desde], queryFn: () => dashboardApi.recaudacionMensual(desde) });
  const cursos = useQuery({
    queryKey: [...queryKeys.dashboard, 'cursos-top'],
    queryFn: () => cursosApi.listar({ page: 1, pageSize: 100 }),
  });

  const r = resumen.data;
  const porCurso = (cursos.data?.data ?? [])
    .filter((c) => Number(c.recaudado) > 0)
    .sort((a, b) => Number(b.recaudado) - Number(a.recaudado))
    .slice(0, 8)
    .map((c) => ({ nombre: c.nombre, valor: Number(c.recaudado) }));
  const mensualData = (mensual.data ?? []).map((m) => ({ nombre: formatMes(m.mes), valor: m.total }));

  const saludo = (() => {
    const h = Number(new Intl.DateTimeFormat('es-PE', { hour: 'numeric', hour12: false, timeZone: 'America/Lima' }).format(new Date()));
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  const tarjetas = [
    { label: 'Total de cursos', value: formatNumero(r?.total_cursos), icon: <BookOpen className="h-5 w-5" />, tono: 'brand' as const },
    { label: 'Total de estudiantes', value: formatNumero(r?.total_estudiantes), icon: <Users className="h-5 w-5" />, tono: 'violet' as const },
    { label: 'Total de inscritos', value: formatNumero(r?.total_inscritos), icon: <ClipboardList className="h-5 w-5" />, tono: 'blue' as const },
    { label: 'Total recaudado', value: formatMoneda(r?.total_recaudado), icon: <CircleDollarSign className="h-5 w-5" />, tono: 'green' as const },
    { label: 'Pagos pendientes', value: formatNumero(r?.pagos_pendientes), hint: `${formatMoneda(r?.monto_por_cobrar)} por cobrar`, icon: <Clock className="h-5 w-5" />, tono: 'red' as const },
    { label: 'Cursos activos', value: formatNumero(r?.cursos_activos), hint: 'Programados o en ejecución', icon: <PlayCircle className="h-5 w-5" />, tono: 'amber' as const },
  ];

  return (
    <>
      <PageHeader title={`${saludo}${perfil?.nombre_completo ? ', ' + perfil.nombre_completo.split(' ')[0] : ''}`} description="Resumen gerencial de cursos, inscripciones y cobranza" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {tarjetas.map((t) =>
          resumen.isLoading ? <Skeleton key={t.label} className="h-[76px] rounded-xl" /> : <StatCard key={t.label} {...t} />,
        )}
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card title="Recaudación mensual" description="Últimos 12 meses" className="lg:col-span-2">
          {mensual.isLoading ? <Skeleton className="h-[280px]" /> : <GraficoLinea data={mensualData} />}
        </Card>
        <Card title="Cobranza" description="Recaudado vs. por cobrar">
          {resumen.isLoading ? (
            <Skeleton className="h-[260px]" />
          ) : (
            <GraficoPie
              data={[
                { nombre: 'Recaudado', valor: Number(r?.total_recaudado ?? 0) },
                { nombre: 'Por cobrar', valor: Number(r?.monto_por_cobrar ?? 0) },
              ]}
              colores={[ESTADO_COLOR.pagado, ESTADO_COLOR.pendiente]}
            />
          )}
        </Card>
        <Card title="Recaudación por curso" description="Top 8 cursos" className="lg:col-span-3">
          {cursos.isLoading ? <Skeleton className="h-[280px]" /> : <GraficoBarras data={porCurso} horizontal />}
        </Card>
      </div>
    </>
  );
}
