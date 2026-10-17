import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Copy, Eye, Pencil, Plus, Trash2 } from 'lucide-react';
import { useCursos, useDuplicarCurso, useEliminarCurso } from '@/hooks/useCursos';
import { usePaginacion } from '@/hooks/usePaginacion';
import { usePermisos } from '@/hooks/usePermisos';
import { Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, Input, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_CURSO, MODALIDADES, toOptions } from '@/lib/constants';
import { formatFecha, formatMoneda } from '@/utils/format';
import { notify } from '@/services/notify';
import { CursoFormModal } from './CursoFormModal';
import type { CursoResumen, EstadoCurso, Modalidad } from '@/types/database';

export default function CursosPage() {
  const navigate = useNavigate();
  const { puede } = usePermisos();
  const gestionar = puede('cursos.gestionar');
  const t = usePaginacion({ estado: '' as EstadoCurso | '', modalidad: '' as Modalidad | '', desde: '', hasta: '' });
  const { data, isLoading, isFetching } = useCursos(t.params);
  const eliminar = useEliminarCurso();
  const duplicar = useDuplicarCurso();
  const [modal, setModal] = useState<{ open: boolean; curso?: CursoResumen | null }>({ open: false });

  const onEliminar = async (c: CursoResumen) => {
    if (!(await notify.confirm({ title: `¿Eliminar "${c.nombre}"?`, text: 'El curso dejará de mostrarse. Esta acción queda registrada en auditoría.', confirmText: 'Eliminar', danger: true }))) return;
    try {
      await eliminar.mutateAsync(c.id);
      notify.success('Curso eliminado');
    } catch (e) {
      notify.error(e);
    }
  };

  const onDuplicar = async (c: CursoResumen) => {
    try {
      const nuevo = await duplicar.mutateAsync(c.id);
      notify.success('Curso duplicado', `Código: ${nuevo.codigo}`);
      setModal({ open: true, curso: { ...c, ...nuevo } });
    } catch (e) {
      notify.error(e);
    }
  };

  const columnas: Column<CursoResumen>[] = [
    {
      key: 'curso', header: 'Curso',
      cell: (c) => (
        <div className="min-w-[180px]">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</p>
          <p className="text-xs text-zinc-500">{c.codigo} · {MODALIDADES[c.modalidad]}</p>
        </div>
      ),
    },
    { key: 'fechas', header: 'Fechas', hideOnMobile: true, cell: (c) => <span className="text-xs">{formatFecha(c.fecha_inicio)} – {formatFecha(c.fecha_fin)}</span> },
    { key: 'horario', header: 'Horario', hideOnMobile: true, cell: (c) => <span className="text-xs">{c.horario ?? '—'}</span> },
    { key: 'costo', header: 'Costo', align: 'right', cell: (c) => formatMoneda(c.costo) },
    {
      key: 'cupos', header: 'Inscritos', align: 'center',
      cell: (c) => {
        const pct = Math.min(100, ((c.cupos - c.cupos_disponibles) / c.cupos) * 100);
        return (
          <div className="mx-auto w-20">
            <p className="text-xs font-medium">{c.cupos - c.cupos_disponibles}/{c.cupos}</p>
            <div className="mt-1 h-1.5 rounded-full bg-zinc-100 dark:bg-white/10">
              <div className={`h-1.5 rounded-full ${pct >= 100 ? 'bg-red-500' : pct >= 80 ? 'bg-amber-500' : 'bg-brand-500'}`} style={{ width: `${pct}%` }} />
            </div>
          </div>
        );
      },
    },
    { key: 'estado', header: 'Estado', cell: (c) => <EstadoBadge valor={c.estado} etiquetas={ESTADOS_CURSO} /> },
    {
      key: 'acciones', header: '', align: 'right',
      cell: (c) => (
        <div className="flex justify-end">
          <IconAction label="Ver inscritos" onClick={() => navigate(`/cursos/${c.id}`)}><Eye className="h-4 w-4" /></IconAction>
          {gestionar && (
            <>
              <IconAction label="Editar" onClick={() => setModal({ open: true, curso: c })}><Pencil className="h-4 w-4" /></IconAction>
              <IconAction label="Duplicar" onClick={() => onDuplicar(c)}><Copy className="h-4 w-4" /></IconAction>
              <IconAction label="Eliminar" danger onClick={() => onEliminar(c)}><Trash2 className="h-4 w-4" /></IconAction>
            </>
          )}
        </div>
      ),
    },
  ];

  const activos = [t.filtros.estado, t.filtros.modalidad, t.filtros.desde, t.filtros.hasta].filter(Boolean).length;

  return (
    <>
      <PageHeader
        title="Cursos"
        description="Programación, costos y cupos de los cursos"
        actions={gestionar && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, curso: null })}>Nuevo curso</Button>}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar por nombre o código…" activos={activos} onClear={t.limpiarFiltros}>
        <Field label="Estado">
          <Select value={t.filtros.estado} onChange={(e) => t.setFiltro('estado', e.target.value as EstadoCurso | '')}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_CURSO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Modalidad">
          <Select value={t.filtros.modalidad} onChange={(e) => t.setFiltro('modalidad', e.target.value as Modalidad | '')}>
            <option value="">Todas</option>
            {toOptions(MODALIDADES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
        <Field label="Inicio desde"><Input type="date" value={t.filtros.desde} onChange={(e) => t.setFiltro('desde', e.target.value)} /></Field>
        <Field label="Inicio hasta"><Input type="date" value={t.filtros.hasta} onChange={(e) => t.setFiltro('hasta', e.target.value)} /></Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(c) => c.id}
        loading={isLoading}
        fetching={isFetching}
        onRowClick={(c) => navigate(`/cursos/${c.id}`)}
        emptyTitle="No hay cursos"
        emptyDescription={t.search || activos ? 'Pruebe con otros filtros.' : 'Cree el primer curso para empezar.'}
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <CursoFormModal open={modal.open} curso={modal.curso} onClose={() => setModal({ open: false })} />
    </>
  );
}
