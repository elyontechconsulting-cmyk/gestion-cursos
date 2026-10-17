import { useState } from 'react';
import { useMutation, useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Power, ShieldCheck } from 'lucide-react';
import { usuariosApi } from '@/api/usuarios.api';
import { queryKeys } from '@/lib/queryClient';
import { usePaginacion } from '@/hooks/usePaginacion';
import { useAuth } from '@/contexts/AuthContext';
import { usuarioSchema, type UsuarioInput } from '@/schemas/auth.schema';
import { Badge, Button, DataTable, EstadoBadge, Field, FilterBar, IconAction, Input, Modal, PageHeader, Select, type Column } from '@/components/ui';
import { ROLES, toOptions } from '@/lib/constants';
import { formatFechaHora } from '@/utils/format';
import { notify } from '@/services/notify';
import type { Usuario } from '@/types/database';

export default function UsuariosPage() {
  const { perfil } = useAuth();
  const qc = useQueryClient();
  const t = usePaginacion({});
  const { data, isLoading, isFetching } = useQuery({
    queryKey: [...queryKeys.usuarios, t.params],
    queryFn: () => usuariosApi.listar(t.params),
    placeholderData: keepPreviousData,
  });
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: usuariosApi.roles, staleTime: Infinity });
  const actualizar = useMutation({
    mutationFn: ({ id, cambios }: { id: string; cambios: Parameters<typeof usuariosApi.actualizar>[1] }) => usuariosApi.actualizar(id, cambios),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.usuarios }),
  });
  const [nuevo, setNuevo] = useState(false);

  const cambiarRol = async (u: Usuario) => {
    const opciones = Object.fromEntries(roles.map((r) => [String(r.id), r.nombre]));
    const v = await notify.select({ title: `Rol de ${u.email}`, options: opciones, value: String(u.rol_id) });
    if (!v || Number(v) === u.rol_id) return;
    try {
      await actualizar.mutateAsync({ id: u.id, cambios: { rol_id: Number(v) } });
      notify.success('Rol actualizado');
    } catch (e) {
      notify.error(e);
    }
  };

  const toggleActivo = async (u: Usuario) => {
    if (!(await notify.confirm({ title: u.activo ? '¿Desactivar usuario?' : '¿Activar usuario?', text: u.email, danger: u.activo }))) return;
    try {
      await actualizar.mutateAsync({ id: u.id, cambios: { activo: !u.activo } });
      notify.success(u.activo ? 'Usuario desactivado' : 'Usuario activado');
    } catch (e) {
      notify.error(e);
    }
  };

  const columnas: Column<Usuario>[] = [
    { key: 'u', header: 'Usuario', cell: (u) => <div><p className="font-medium text-zinc-900 dark:text-zinc-100">{u.nombre_completo || '—'}</p><p className="text-xs text-zinc-500">{u.email}</p></div> },
    { key: 'r', header: 'Rol', cell: (u) => u.roles && <EstadoBadge valor={u.roles.codigo} etiquetas={ROLES} /> },
    { key: 'e', header: 'Estado', cell: (u) => <Badge tono={u.activo ? 'green' : 'gray'}>{u.activo ? 'Activo' : 'Inactivo'}</Badge> },
    { key: 'c', header: 'Creado', hideOnMobile: true, cell: (u) => <span className="text-xs">{formatFechaHora(u.created_at)}</span> },
    {
      key: 'a', header: '', align: 'right',
      cell: (u) => u.id === perfil?.id ? <span className="text-xs text-zinc-400">Usted</span> : (
        <div className="flex justify-end">
          <IconAction label="Cambiar rol" onClick={() => cambiarRol(u)}><ShieldCheck className="h-4 w-4" /></IconAction>
          <IconAction label={u.activo ? 'Desactivar' : 'Activar'} danger={u.activo} onClick={() => toggleActivo(u)}><Power className="h-4 w-4" /></IconAction>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Cuentas de acceso y roles del sistema"
        actions={<Button icon={<Plus className="h-4 w-4" />} onClick={() => setNuevo(true)}>Nuevo usuario</Button>}
      />
      <FilterBar search={t.search} onSearch={t.setSearch} placeholder="Buscar por nombre o correo…" />
      <DataTable
        columns={columnas}
        data={data?.data ?? []}
        rowKey={(u) => u.id}
        loading={isLoading}
        fetching={isFetching}
        pagination={{ page: t.page, pageSize: t.pageSize, total: data?.count ?? 0, onPageChange: t.setPage, onPageSizeChange: t.setPageSize }}
      />
      <NuevoUsuarioModal open={nuevo} onClose={() => setNuevo(false)} onCreado={() => qc.invalidateQueries({ queryKey: queryKeys.usuarios })} />
    </>
  );
}

function NuevoUsuarioModal({ open, onClose, onCreado }: { open: boolean; onClose: () => void; onCreado: () => void }) {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<UsuarioInput>({
    resolver: zodResolver(usuarioSchema),
    defaultValues: { email: '', nombre_completo: '', rol: 'operador', password: '' },
  });
  const onSubmit = async (d: UsuarioInput) => {
    try {
      await usuariosApi.crear(d);
      notify.success(d.password ? 'Usuario creado' : 'Invitación enviada', d.email);
      reset();
      onCreado();
      onClose();
    } catch (e) {
      notify.error(e);
    }
  };
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Nuevo usuario"
      description="Sin contraseña se envía una invitación por correo"
      footer={<><Button variant="outline" onClick={onClose}>Cancelar</Button><Button type="submit" form="form-usuario" loading={isSubmitting}>Crear</Button></>}
    >
      <form id="form-usuario" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <Field label="Nombre completo" required error={errors.nombre_completo?.message}><Input {...register('nombre_completo')} /></Field>
        <Field label="Correo" required error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
        <Field label="Rol" required>
          <Select {...register('rol')}>{toOptions(ROLES).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</Select>
        </Field>
        <Field label="Contraseña temporal (opcional)" error={errors.password?.message} hint="Mínimo 10 caracteres">
          <Input type="password" autoComplete="new-password" {...register('password')} />
        </Field>
      </form>
    </Modal>
  );
}
