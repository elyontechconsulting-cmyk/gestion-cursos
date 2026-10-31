import { useNavigate } from 'react-router-dom';
import { NotebookPen } from 'lucide-react';
import { useCursos } from '@/hooks/useCursos';
import { usePaginacion } from '@/hooks/usePaginacion';
import { useAuth } from '@/contexts/AuthContext';
import { Button, DataTable, EstadoBadge, Field, FilterBar, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_CURSO, toOptions } from '@/lib/constants';
import { formatFecha } from '@/utils/format';
import type { CursoResumen, EstadoCurso } from '@/types/database';

export default function AcademicoPage() {
  const navigate = useNavigate();
  const { perfil, rol } = useAuth();
  // El operador ve solo los cursos donde es tutor
  const soloMios = rol === 'operador';
  const t = usePaginacion({ estado: '' as EstadoCurso | '' });
  const { data, isLoading, isFetching } = useCursos({ ...t.params, tutorId: soloMios ? perfil?.id : undefined });

  const columnas: Column<CursoResumen>[] = [
    { key: 'curso', header: 'Curso', cell: (c) => <div className="min-w-[180px]"><p className="font-medium text-zinc-900 dark:text-zinc-100">{c.nombre}</p><p className="text-xs text-zinc-500">{c.codigo} · {formatFecha(c.fecha_inicio)}</p></div> },
    { key: 'tutor', header: 'Tutor', hideOnMobile: true, cell: (c) => <span className="text-xs">{c.tutor_nombre || c.tutor_email || '—'}</span> },
    { key: 'prof', header: 'Profesores', hideOnMobile: true, cell: (c) => <span className="block max-w-[220px] truncate text-xs">{c.profesores || '—'}</span> },
    { key: 'ses', header: 'Sesiones', align: 'center', hideOnMobile: true, cell: (c) => c.numero_sesiones },
    { key: 'ins', header: 'Inscritos', align: 'center', cell: (c) => c.inscritos },
    { key: 'estado', header: 'Estado', cell: (c) => <EstadoBadge valor={c.estado} etiquetas={ESTADOS_CURSO} /> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (c) => <Button size="sm" variant="outline" icon={<NotebookPen className="h-3.5 w-3.5" />} onClick={() => navigate(`/academico/${c.id}`)}>Abrir</Button>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Registro académico"
        description={soloMios ? 'Cursos donde usted es tutor: asistencias, actividades y notas' : 'Asistencias, actividades y notas por curso'}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar curso o código…" activos={t.filtros.estado ? 1 : 0} onClear={t.limpiarFiltros}>
        <Field label="Estado">
          <Select value={t.filtros.estado} onChange={(e) => t.setFiltro('estado', e.target.value as EstadoCurso | '')}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_CURSO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(c) => c.id}
        loading={isLoading}
        fetching={isFetching}
        onRowClick={(c) => navigate(`/academico/${c.id}`)}
        emptyTitle={soloMios ? 'No tiene cursos asignados como tutor' : 'No hay cursos'}
        emptyDescription={soloMios ? 'Pida al administrador que lo asigne como tutor en la ficha del curso.' : undefined}
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
    </>
  );
}
