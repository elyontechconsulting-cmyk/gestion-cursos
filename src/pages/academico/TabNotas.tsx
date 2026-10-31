import { useEffect, useMemo, useState } from 'react';
import { Save } from 'lucide-react';
import { useGuardarCalificaciones } from '@/hooks/useAcademico';
import { Button, DataTable, EstadoBadge, Input, type Column } from '@/components/ui';
import { ESTADOS_ACADEMICOS } from '@/lib/constants';
import { notify } from '@/services/notify';
import { cn } from '@/utils/cn';
import type { NotaDetalle } from '@/types/database';

type Edicion = { trabajo: string; examen: string };

const aTexto = (v: number | null) => (v === null || v === undefined ? '' : String(Number(v)));

/** '' → null; número entre 0 y 20 → número; cualquier otra cosa → undefined (inválido). */
function leerNota(v: string): number | null | undefined {
  const t = v.trim().replace(',', '.');
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 && n <= 20 ? Math.round(n * 100) / 100 : undefined;
}

const fmt = (n: number) => Number(n).toLocaleString('es-PE', { maximumFractionDigits: 2 });

export function TabNotas({ notas, cargando, fetching, puedeRegistrar }: {
  notas: NotaDetalle[];
  cargando: boolean;
  fetching: boolean;
  puedeRegistrar: boolean;
}) {
  const guardar = useGuardarCalificaciones();
  const [edicion, setEdicion] = useState<Record<string, Edicion>>({});

  useEffect(() => {
    setEdicion(Object.fromEntries(notas.map((n) => [n.inscripcion_id, { trabajo: aTexto(n.nota_trabajo), examen: aTexto(n.nota_examen) }])));
  }, [notas]);

  const modificadas = useMemo(
    () => notas.filter((n) => {
      const e = edicion[n.inscripcion_id];
      return e && (e.trabajo !== aTexto(n.nota_trabajo) || e.examen !== aTexto(n.nota_examen));
    }),
    [notas, edicion],
  );

  const editar = (id: string, campo: keyof Edicion, valor: string) =>
    setEdicion((m) => ({ ...m, [id]: { ...m[id], [campo]: valor } }));

  const onGuardar = async () => {
    const filas = modificadas.map((n) => {
      const e = edicion[n.inscripcion_id];
      return { inscripcion_id: n.inscripcion_id, nota_trabajo: leerNota(e.trabajo), nota_examen: leerNota(e.examen) };
    });
    if (filas.some((f) => f.nota_trabajo === undefined || f.nota_examen === undefined)) {
      notify.error('Las notas deben estar entre 0 y 20');
      return;
    }
    try {
      await guardar.mutateAsync(filas as { inscripcion_id: string; nota_trabajo: number | null; nota_examen: number | null }[]);
      notify.success('Notas guardadas');
    } catch (e) {
      notify.error(e);
    }
  };

  /** Vista previa del promedio con las notas que se están escribiendo (la BD calcula el definitivo). */
  const promedio = (n: NotaDetalle) => {
    const e = edicion[n.inscripcion_id];
    const trabajo = e ? leerNota(e.trabajo) : n.nota_trabajo;
    const examen = e ? leerNota(e.examen) : n.nota_examen;
    const suma = Number(n.nota_asistencia) + Number(n.nota_devocional) + Number(n.nota_interseccion) + Number(n.nota_servicio)
      + Number(trabajo ?? 0) + Number(examen ?? 0);
    return Math.round((suma / 6) * 100) / 100;
  };

  const celdaConteo = (cantidad: number, nota: number) => (
    <div className="leading-tight"><p className="font-medium">{fmt(nota)}</p><p className="text-xs text-zinc-500">{cantidad} × 2</p></div>
  );

  const inputNota = (n: NotaDetalle, campo: keyof Edicion) => {
    const valor = edicion[n.inscripcion_id]?.[campo] ?? '';
    return (
      <Input
        type="number" inputMode="decimal" min="0" max="20" step="0.5"
        aria-label={`${campo === 'trabajo' ? 'Trabajo' : 'Examen'}: ${n.estudiante_nombre}`}
        className="mx-auto w-20 text-center"
        value={valor}
        invalid={leerNota(valor) === undefined}
        disabled={!puedeRegistrar || n.inscripcion_estado === 'retirado'}
        onChange={(e) => editar(n.inscripcion_id, campo, e.target.value)}
      />
    );
  };

  const columnas: Column<NotaDetalle>[] = [
    { key: 'est', header: 'Estudiante', cell: (n) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{n.estudiante_nombre}</p><p className="text-xs text-zinc-500">{n.asistencias} asist. · {n.faltas} faltas · {n.sesiones_registradas}/{n.numero_sesiones} ses.</p></div> },
    { key: 'asis', header: 'Asistencia', align: 'center', cell: (n) => celdaConteo(n.asistencias, n.nota_asistencia) },
    { key: 'dev', header: 'Devocional', align: 'center', hideOnMobile: true, cell: (n) => celdaConteo(n.devocionales, n.nota_devocional) },
    { key: 'int', header: 'Intersección', align: 'center', hideOnMobile: true, cell: (n) => celdaConteo(n.intersecciones, n.nota_interseccion) },
    { key: 'ser', header: 'Servicio', align: 'center', hideOnMobile: true, cell: (n) => celdaConteo(n.servicios, n.nota_servicio) },
    { key: 'tra', header: 'Trabajo', align: 'center', cell: (n) => inputNota(n, 'trabajo') },
    { key: 'exa', header: 'Examen', align: 'center', cell: (n) => inputNota(n, 'examen') },
    {
      key: 'prom', header: 'Promedio', align: 'center',
      cell: (n) => {
        const p = promedio(n);
        return <span className={cn('text-base font-semibold', p >= n.nota_aprobatoria ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>{fmt(p)}</span>;
      },
    },
    { key: 'estado', header: 'Estado', cell: (n) => <EstadoBadge valor={n.estado_academico} etiquetas={ESTADOS_ACADEMICOS} /> },
  ];

  return (
    <>
      {puedeRegistrar && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-zinc-500">
            Registre el trabajo final y el examen escrito (0 a 20). {modificadas.length > 0 && <span className="font-medium text-amber-600 dark:text-amber-400">{modificadas.length} sin guardar.</span>}
          </p>
          <Button icon={<Save className="h-4 w-4" />} onClick={onGuardar} loading={guardar.isPending} disabled={!modificadas.length}>
            Guardar notas
          </Button>
        </div>
      )}
      <DataTable
        columns={columnas}
        data={notas}
        rowKey={(n) => n.inscripcion_id}
        loading={cargando}
        fetching={fetching}
        emptyTitle="No hay estudiantes inscritos"
      />
      <p className="mt-2 text-xs text-zinc-500">
        El estado queda “En curso” hasta registrar el trabajo y el examen. Al llegar al máximo de faltas pasa a “Desaprobado por faltas”.
      </p>
    </>
  );
}
