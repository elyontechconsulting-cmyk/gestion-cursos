import { useState } from 'react';
import { ClipboardList, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEliminarEstudiante, useEstudiantes } from '@/hooks/useEstudiantes';
import { useInscripciones } from '@/hooks/useInscripciones';
import { usePaginacion } from '@/hooks/usePaginacion';
import { usePermisos } from '@/hooks/usePermisos';
import { Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, Modal, PageHeader, Select, type Column } from '@/components/ui';
import { ESTADOS_INSCRIPCION, ESTADOS_PAGO, ESTADOS_REGISTRO, toOptions } from '@/lib/constants';
import { formatFecha, formatMoneda, nombreCompleto } from '@/utils/format';
import { notify } from '@/services/notify';
import { EstudianteFormModal } from './EstudianteFormModal';
import type { EstadoRegistro, Estudiante } from '@/types/database';

export default function EstudiantesPage() {
  const { puede } = usePermisos();
  const t = usePaginacion({ estado: '' as EstadoRegistro | '' });
  const { data, isLoading, isFetching } = useEstudiantes(t.params);
  const eliminar = useEliminarEstudiante();
  const [modal, setModal] = useState<{ open: boolean; estudiante?: Estudiante | null }>({ open: false });
  const [verCursos, setVerCursos] = useState<Estudiante | null>(null);

  const onEliminar = async (e: Estudiante) => {
    if (!(await notify.confirm({ title: `¿Eliminar a ${nombreCompleto(e)}?`, text: 'El registro se conservará en auditoría.', confirmText: 'Eliminar', danger: true }))) return;
    try {
      await eliminar.mutateAsync(e.id);
      notify.success('Estudiante eliminado');
    } catch (err) {
      notify.error(err);
    }
  };

  const columnas: Column<Estudiante>[] = [
    { key: 'dni', header: 'DNI', cell: (e) => <span className="font-mono text-xs">{e.dni}</span> },
    { key: 'nombre', header: 'Estudiante', cell: (e) => <span className="font-medium text-zinc-900 dark:text-zinc-100">{e.apellido_paterno} {e.apellido_materno}, {e.nombres}</span> },
    { key: 'correo', header: 'Correo', hideOnMobile: true, cell: (e) => e.correo ?? '—' },
    { key: 'tel', header: 'Teléfono', hideOnMobile: true, cell: (e) => e.telefono ?? '—' },
    { key: 'estado', header: 'Estado', cell: (e) => <EstadoBadge valor={e.estado} etiquetas={ESTADOS_REGISTRO} /> },
    {
      key: 'acc', header: '', align: 'right',
      cell: (e) => (
        <div className="flex justify-end">
          <IconAction label="Ver cursos" onClick={() => setVerCursos(e)}><ClipboardList className="h-4 w-4" /></IconAction>
          {puede('estudiantes.gestionar') && (
            <>
              <IconAction label="Editar" onClick={() => setModal({ open: true, estudiante: e })}><Pencil className="h-4 w-4" /></IconAction>
              <IconAction label="Eliminar" danger onClick={() => onEliminar(e)}><Trash2 className="h-4 w-4" /></IconAction>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Estudiantes"
        description="Registro de estudiantes con validación de DNI"
        actions={puede('estudiantes.crear') && <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true, estudiante: null })}>Nuevo estudiante</Button>}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar por DNI, nombre o correo…" activos={t.filtros.estado ? 1 : 0} onClear={t.limpiarFiltros}>
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
        rowKey={(e) => e.id}
        loading={isLoading}
        fetching={isFetching}
        emptyTitle="No hay estudiantes"
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <EstudianteFormModal open={modal.open} estudiante={modal.estudiante} onClose={() => setModal({ open: false })} />
      <CursosEstudianteModal estudiante={verCursos} onClose={() => setVerCursos(null)} />
    </>
  );
}

function CursosEstudianteModal({ estudiante, onClose }: { estudiante: Estudiante | null; onClose: () => void }) {
  const { data, isLoading } = useInscripciones({ page: 1, pageSize: 100, estudianteId: estudiante?.id }, !!estudiante);
  return (
    <Modal open={!!estudiante} onClose={onClose} title="Cursos del estudiante" description={estudiante ? nombreCompleto(estudiante) : ''} size="lg">
      <DataTable
        columns={[
          { key: 'c', header: 'Curso', cell: (r) => <div><p className="font-medium">{r.curso_nombre}</p><p className="text-xs text-zinc-500">{r.curso_codigo} · {formatFecha(r.fecha_inscripcion)}</p></div> },
          { key: 'e', header: 'Estado', cell: (r) => <EstadoBadge valor={r.estado} etiquetas={ESTADOS_INSCRIPCION} /> },
          { key: 'p', header: 'Pago', cell: (r) => <EstadoBadge valor={r.estado_pago} etiquetas={ESTADOS_PAGO} /> },
          { key: 's', header: 'Saldo', align: 'right', cell: (r) => formatMoneda(r.saldo_pendiente) },
        ]}
        data={data?.data ?? []}
        rowKey={(r) => r.id}
        loading={isLoading}
        emptyTitle="Sin inscripciones"
      />
    </Modal>
  );
}
