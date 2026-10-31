import { useEffect, useMemo, useState } from 'react';
import { Check, Save } from 'lucide-react';
import { useAsistencias, useGuardarSesion } from '@/hooks/useAcademico';
import { Badge, Button, DataTable, type Column } from '@/components/ui';
import { notify } from '@/services/notify';
import { cn } from '@/utils/cn';
import type { CursoResumen, NotaDetalle } from '@/types/database';

type Campo = 'asistio' | 'devocional' | 'interseccion' | 'servicio';
type Marcas = Record<Campo, boolean>;

const CAMPOS: { campo: Campo; label: string }[] = [
  { campo: 'asistio', label: 'Asistió' },
  { campo: 'devocional', label: 'Devocional' },
  { campo: 'interseccion', label: 'Intersección' },
  { campo: 'servicio', label: 'Servicio' },
];

const SIN_MARCAS: Marcas = { asistio: false, devocional: false, interseccion: false, servicio: false };

export function TabSesiones({ curso, notas, cargando, puedeRegistrar }: {
  curso: CursoResumen;
  notas: NotaDetalle[];
  cargando: boolean;
  puedeRegistrar: boolean;
}) {
  const asistencias = useAsistencias(curso.id);
  const guardar = useGuardarSesion();
  const [sesion, setSesion] = useState(1);
  const [marcas, setMarcas] = useState<Record<string, Marcas>>({});
  const [cambios, setCambios] = useState(false);

  const estudiantes = useMemo(() => notas.filter((n) => n.inscripcion_estado !== 'retirado'), [notas]);
  const registradas = useMemo(() => new Set((asistencias.data ?? []).map((a) => a.sesion)), [asistencias.data]);

  // Carga lo guardado de la sesión elegida
  useEffect(() => {
    const guardadas = new Map((asistencias.data ?? []).filter((a) => a.sesion === sesion).map((a) => [a.inscripcion_id, a]));
    setMarcas(
      Object.fromEntries(
        estudiantes.map((e) => {
          const a = guardadas.get(e.inscripcion_id);
          return [e.inscripcion_id, a ? { asistio: a.asistio, devocional: a.devocional, interseccion: a.interseccion, servicio: a.servicio } : { ...SIN_MARCAS }];
        }),
      ),
    );
    setCambios(false);
  }, [sesion, asistencias.data, estudiantes]);

  const cambiarSesion = async (n: number) => {
    if (n === sesion) return;
    if (cambios && !(await notify.confirm({ title: 'Hay cambios sin guardar', text: `Se perderán las marcas de la sesión ${sesion}.`, confirmText: 'Descartar cambios', danger: true }))) return;
    setSesion(n);
  };

  const marcar = (id: string, campo: Campo, valor: boolean) => {
    setMarcas((m) => ({ ...m, [id]: { ...(m[id] ?? SIN_MARCAS), [campo]: valor } }));
    setCambios(true);
  };

  const marcarTodos = (campo: Campo, valor: boolean) => {
    setMarcas((m) => Object.fromEntries(Object.entries(m).map(([id, v]) => [id, { ...v, [campo]: valor }])));
    setCambios(true);
  };

  const onGuardar = async () => {
    try {
      await guardar.mutateAsync(Object.entries(marcas).map(([inscripcion_id, m]) => ({ inscripcion_id, sesion, ...m })));
      notify.success(`Sesión ${sesion} guardada`);
    } catch (e) {
      notify.error(e);
    }
  };

  const columnas: Column<NotaDetalle>[] = [
    { key: 'est', header: 'Estudiante', cell: (n) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{n.estudiante_nombre}</p><p className="text-xs text-zinc-500">DNI {n.dni}</p></div> },
    ...CAMPOS.map(({ campo, label }): Column<NotaDetalle> => {
      const todos = estudiantes.length > 0 && estudiantes.every((e) => marcas[e.inscripcion_id]?.[campo]);
      return {
        key: campo,
        align: 'center',
        header: (
          <label className="inline-flex cursor-pointer flex-col items-center gap-1">
            {label}
            {puedeRegistrar && <Casilla marcado={todos} onChange={(v) => marcarTodos(campo, v)} titulo={`Marcar todos: ${label}`} />}
          </label>
        ),
        cell: (n) => (
          <Casilla
            marcado={!!marcas[n.inscripcion_id]?.[campo]}
            onChange={(v) => marcar(n.inscripcion_id, campo, v)}
            disabled={!puedeRegistrar}
            titulo={`${label}: ${n.estudiante_nombre}`}
          />
        ),
      };
    }),
    {
      key: 'faltas', header: 'Faltas', align: 'center',
      cell: (n) => (
        <Badge tono={n.faltas >= n.faltas_maximas ? 'red' : n.faltas === n.faltas_maximas - 1 ? 'amber' : 'gray'}>
          {n.faltas} / {n.faltas_maximas}
        </Badge>
      ),
    },
  ];

  return (
    <>
      <div className="card mb-4 p-4">
        <p className="mb-2 text-xs font-medium text-zinc-500">Sesión</p>
        <div className="flex flex-wrap gap-1.5">
          {Array.from({ length: curso.numero_sesiones }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => cambiarSesion(n)}
              title={registradas.has(n) ? `Sesión ${n} (registrada)` : `Sesión ${n} (sin registrar)`}
              className={cn(
                'relative flex h-9 min-w-[2.25rem] items-center justify-center rounded-lg border px-2 text-sm font-medium transition',
                n === sesion
                  ? 'border-brand-600 bg-brand-600 text-white'
                  : 'border-zinc-200 hover:border-zinc-300 dark:border-white/10 dark:hover:border-white/20',
              )}
            >
              {n}
              {registradas.has(n) && (
                <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-emerald-500 text-white">
                  <Check className="h-2.5 w-2.5" strokeWidth={3} />
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            {registradas.has(sesion) ? `Sesión ${sesion} registrada. Puede corregirla y volver a guardar.` : `Sesión ${sesion} aún sin registrar.`}
            {sesion === curso.numero_sesiones && ' Última sesión: registre también el trabajo final y el examen en "Notas y promedio".'}
          </p>
          {puedeRegistrar && (
            <Button icon={<Save className="h-4 w-4" />} onClick={onGuardar} loading={guardar.isPending} disabled={!estudiantes.length}>
              Guardar sesión {sesion}
            </Button>
          )}
        </div>
      </div>
      <DataTable
        columns={columnas}
        data={estudiantes}
        rowKey={(n) => n.inscripcion_id}
        loading={cargando || asistencias.isLoading}
        emptyTitle="No hay estudiantes inscritos"
      />
    </>
  );
}

function Casilla({ marcado, onChange, disabled, titulo }: { marcado: boolean; onChange: (v: boolean) => void; disabled?: boolean; titulo: string }) {
  return (
    <input
      type="checkbox"
      aria-label={titulo}
      title={titulo}
      checked={marcado}
      disabled={disabled}
      onChange={(e) => onChange(e.target.checked)}
      className="h-5 w-5 cursor-pointer rounded border-zinc-300 text-brand-600 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
    />
  );
}
