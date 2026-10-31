import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarCheck, FileSpreadsheet, FileText, GraduationCap, UserCheck, Users } from 'lucide-react';
import { useCurso } from '@/hooks/useCursos';
import { useNotas } from '@/hooks/useAcademico';
import { useAuth } from '@/contexts/AuthContext';
import { Button, Card, PageHeader, PantallaCarga } from '@/components/ui';
import { ESTADOS_ACADEMICOS, ESTADOS_CURSO } from '@/lib/constants';
import { exportarExcel, exportarPdf, type ColumnaExport } from '@/services/export.service';
import { notify } from '@/services/notify';
import { cn } from '@/utils/cn';
import { TabSesiones } from './TabSesiones';
import { TabNotas } from './TabNotas';
import type { NotaDetalle } from '@/types/database';

export default function RegistroAcademicoPage() {
  const { id } = useParams<{ id: string }>();
  const { perfil, rol } = useAuth();
  const { data: curso, isLoading } = useCurso(id);
  const notas = useNotas(id);
  const [tab, setTab] = useState<'sesiones' | 'notas'>('sesiones');

  if (isLoading || !curso) return <PantallaCarga />;

  // El administrador registra en cualquier curso; el operador solo en los que es tutor (RLS lo exige)
  const puedeRegistrar = rol === 'administrador' || (rol === 'operador' && !!perfil && curso.tutor_id === perfil.id);

  const columnasExport: ColumnaExport<NotaDetalle>[] = [
    { header: 'DNI', value: (r) => r.dni, width: 12 },
    { header: 'Estudiante', value: (r) => r.estudiante_nombre, width: 34 },
    { header: 'Asist.', value: (r) => r.asistencias, tipo: 'numero' },
    { header: 'Faltas', value: (r) => r.faltas, tipo: 'numero' },
    { header: 'N. asist.', value: (r) => r.nota_asistencia, tipo: 'numero' },
    { header: 'N. devoc.', value: (r) => r.nota_devocional, tipo: 'numero' },
    { header: 'N. interc.', value: (r) => r.nota_interseccion, tipo: 'numero' },
    { header: 'N. serv.', value: (r) => r.nota_servicio, tipo: 'numero' },
    { header: 'Trabajo', value: (r) => r.nota_trabajo, tipo: 'numero' },
    { header: 'Examen', value: (r) => r.nota_examen, tipo: 'numero' },
    { header: 'Promedio', value: (r) => r.promedio, tipo: 'numero' },
    { header: 'Estado', value: (r) => ESTADOS_ACADEMICOS[r.estado_academico], width: 22 },
  ];

  const exportar = async (tipo: 'xlsx' | 'pdf') => {
    try {
      const opts = {
        titulo: `Registro de notas · ${curso.nombre}`,
        subtitulo: `${curso.codigo}${curso.tutor_nombre ? ' · Tutor: ' + curso.tutor_nombre : ''}`,
        archivo: `notas_${curso.codigo}`,
        columnas: columnasExport,
        filas: notas.data ?? [],
      };
      await (tipo === 'xlsx' ? exportarExcel(opts) : exportarPdf(opts));
    } catch (e) {
      notify.error(e, 'No se pudo exportar');
    }
  };

  return (
    <>
      <Link to="/academico" className="mb-3 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100">
        <ArrowLeft className="h-4 w-4" /> Registro académico
      </Link>
      <PageHeader
        title={curso.nombre}
        description={`${curso.codigo} · ${ESTADOS_CURSO[curso.estado]}`}
        actions={
          <>
            <Button variant="outline" icon={<FileSpreadsheet className="h-4 w-4" />} onClick={() => exportar('xlsx')} disabled={!notas.data?.length}>Excel</Button>
            <Button variant="outline" icon={<FileText className="h-4 w-4" />} onClick={() => exportar('pdf')} disabled={!notas.data?.length}>PDF</Button>
          </>
        }
      />

      <div className="mb-5 grid gap-4 lg:grid-cols-3">
        <Card title="Docentes" className="lg:col-span-1">
          <dl className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <UserCheck className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div><dt className="text-xs text-zinc-500">Tutor / asistente</dt><dd>{curso.tutor_nombre || curso.tutor_email || 'Sin asignar'}</dd></div>
            </div>
            <div className="flex items-start gap-2">
              <GraduationCap className="mt-0.5 h-4 w-4 shrink-0 text-zinc-400" />
              <div><dt className="text-xs text-zinc-500">Profesores</dt><dd>{curso.profesores || 'Sin asignar'}</dd></div>
            </div>
          </dl>
        </Card>
        <Card title="Reglas de evaluación" className="lg:col-span-2">
          <div className="grid gap-4 text-sm sm:grid-cols-2">
            <ul className="space-y-1.5 text-zinc-600 dark:text-zinc-400">
              <li className="flex items-center gap-2"><CalendarCheck className="h-4 w-4 text-zinc-400" />{curso.numero_sesiones} sesiones</li>
              <li className="flex items-center gap-2"><Users className="h-4 w-4 text-zinc-400" />Con {curso.faltas_maximas} faltas desaprueba (repite el curso)</li>
              <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-zinc-400" />Aprueba con promedio ≥ {Number(curso.nota_aprobatoria)}</li>
            </ul>
            <p className="rounded-lg bg-zinc-50 p-3 text-xs leading-relaxed text-zinc-600 dark:bg-white/[0.03] dark:text-zinc-400">
              <span className="font-medium text-zinc-900 dark:text-zinc-100">Promedio final</span> = promedio de 6 notas:
              asistencias × 2, devocionales × 2, intersecciones × 2, servicios × 2 (máx. 20 cada una),
              trabajo final y examen escrito (0 a 20).
            </p>
          </div>
        </Card>
      </div>

      {!puedeRegistrar && (
        <p className="mb-4 rounded-lg bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
          Solo lectura: únicamente el tutor asignado o un administrador pueden registrar en este curso.
        </p>
      )}

      <div className="mb-4 inline-flex rounded-lg bg-zinc-100 p-1 text-sm dark:bg-white/[0.05]">
        {(['sesiones', 'notas'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn('rounded-md px-3 py-1.5 font-medium transition', tab === t ? 'bg-white shadow-sm dark:bg-white/10' : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100')}
          >
            {t === 'sesiones' ? 'Asistencia por sesión' : 'Notas y promedio'}
          </button>
        ))}
      </div>

      {tab === 'sesiones'
        ? <TabSesiones curso={curso} notas={notas.data ?? []} cargando={notas.isLoading} puedeRegistrar={puedeRegistrar} />
        : <TabNotas notas={notas.data ?? []} cargando={notas.isLoading} fetching={notas.isFetching} puedeRegistrar={puedeRegistrar} />}
    </>
  );
}
