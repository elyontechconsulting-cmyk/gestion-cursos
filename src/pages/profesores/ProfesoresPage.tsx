import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEliminarProfesor, useProfesores } from '@/hooks/useProfesores';
import { usePaginacion } from '@/hooks/usePaginacion';
import { usePermisos } from '@/hooks/usePermisos';
import { Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_REGISTRO, toOptions } from '@/lib/constants';
import { notify } from '@/services/notify';
import { ProfesorFormModal } from './ProfesorFormModal';
import type { EstadoRegistro, Profesor } from '@/types/database';

export default function ProfesoresPage() {
  const { puede } = usePermisos();
  const gestionar = puede('profesores.gestionar');
  const t = usePaginacion({ estado: '' as EstadoRegistro | '' });
  const { data, isLoading, isFetching } = useProfesores(t.params);
  const eliminar = useEliminarProfesor();
  const [modal, setModal] = useState<{ open: boolean; profesor?: Profesor | null }>({ open: false });

  const onEliminar = async (p: Profesor) => {
    if (!(await notify.confirm({ title: `¿Eliminar a ${p.nombres} ${p.apellidos}?`, text: 'Dejará de mostrarse en los cursos asignados.', confirmText: 'Eliminar', danger: true }))) return;
    try {
      await eliminar.mutateAsync(p.id);
      notify.success('Profesor eliminado');
    } catch (e) {
      notify.error(e);
    }
  };

  const columnas: Column<Profesor>[] = [
    { key: 'nombre', header: 'Profesor', cell: (p) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{p.apellidos}, {p.nombres}</p>{p.dni && <p className="text-xs text-zinc-500">DNI {p.dni}</p>}</div> },
    { key: 'esp', header: 'Especialidad', hideOnMobile: true, cell: (p) => p.especialidad ?? '—' },
    { key: 'tel', header: 'Teléfono', hideOnMobile: true, cell: (p) => p.telefono ?? '—' },
    { key: 'correo', header: 'Correo', hideOnMobile: true, cell: (p) => p.correo ?? '—' },
    { key: 'estado', header: 'Estado', cell: (p) => <EstadoBadge valor={p.estado} etiquetas={ESTADOS_REGISTRO} /> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (p) => gestionar && (
        <div className="flex justify-end">
          <IconAction label="Editar" onClick={() => setModal({ open: true, profesor: p })}><Pencil className="h-4 w-4" /></IconAction>
          <IconAction label="Eliminar" danger onClick={() => onEliminar(p)}><Trash2 className="h-4 w-4" /></IconAction>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Profesores"
        description="Docentes que dictan los cursos"
        actions={gestionar && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, profesor: null })}>Nuevo profesor</Button>}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar por nombre, DNI o especialidad…" activos={t.filtros.estado ? 1 : 0} onClear={t.limpiarFiltros}>
        <Field label="Estado">
          <Select value={t.filtros.estado} onChange={(e) => t.setFiltro('estado', e.target.value as EstadoRegistro | '')}>
            <option value="">Todos</option>
            {toOptions(ESTADOS_REGISTRO).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </Select>
        </Field>
      </FilterBar>
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(p) => p.id}
        loading={isLoading}
        fetching={isFetching}
        emptyTitle="No hay profesores registrados"
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <ProfesorFormModal open={modal.open} profesor={modal.profesor} onClose={() => setModal({ open: false })} />
    </>
  );
}
