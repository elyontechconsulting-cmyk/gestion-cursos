# Seguridad

## Matriz de permisos (RLS)

| Recurso | Administrador | Operador | Consulta |
|---|---|---|---|
| Cursos | Ver · crear · editar · eliminar (soft) · duplicar | Ver | Ver |
| Estudiantes | Ver · crear · editar · eliminar | Ver · **crear** | Ver |
| Inscripciones | Ver · crear · cambiar estado · anular | Ver · **crear** · cambiar estado | Ver |
| Pagos | Ver · registrar · anular | Ver · **registrar** | Ver |
| Reportes y dashboard | Sí | Dashboard | **Sí** |
| Usuarios | Gestionar (rol, activar/desactivar, crear) | Solo su perfil | Solo su perfil |
| Auditoría | Ver | — | — |
| Borrado físico | Nadie | Nadie | Nadie |

Las políticas están en la sección 10 de `supabase/migrations/20261016000000_esquema_inicial.sql`. Se apoyan en `fn_rol_actual()` y `fn_tiene_rol(text[])`, funciones `SECURITY DEFINER` con `search_path` fijo que además exigen que el usuario esté **activo** (desactivar a alguien le corta el acceso a los datos de inmediato aunque tenga un JWT vigente).

Se verificó con PostgreSQL (PGlite) que: el operador no puede crear cursos ni anular inscripciones; consulta no puede registrar pagos; un operador no puede subirse de rol; nadie puede hacer `DELETE`; se rechazan cupos excedidos, inscripciones duplicadas, pagos mayores al saldo y pagos electrónicos sin número de operación.

## Buenas prácticas aplicadas

1. **Secretos**: `APISPERU_TOKEN` y `SUPABASE_SERVICE_ROLE_KEY` solo existen como secretos de Edge Functions. Ninguna variable `VITE_*` es secreta (todo `VITE_*` termina en el bundle público).
2. **Edge Functions** validan el JWT (`verify_jwt = true`) y el rol antes de actuar; `CORS` restringido a `ALLOWED_ORIGINS`; timeout de 8 s hacia la API externa.
3. **Registro cerrado**: `enable_signup = false`. Solo un administrador crea usuarios (invitación por correo o contraseña temporal de ≥ 10 caracteres).
4. **Defensa en profundidad**: CHECK constraints (DNI de 8 dígitos, correo, teléfono peruano, fechas, montos), índices únicos parciales, triggers de negocio y validación Zod en el cliente.
5. **Auditoría inalterable**: la tabla `auditoria` no tiene políticas de escritura; solo el trigger `SECURITY DEFINER` inserta. Guarda el antes y el después en JSONB.
6. **Cabeceras HTTP** (`vercel.json`): CSP estricta (sin scripts inline ni de terceros), HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
7. **Sesión**: tokens gestionados por supabase-js con refresco automático; al cerrar sesión se limpia la caché de TanStack Query para no dejar datos en memoria.
8. **Errores**: `utils/errors.ts` traduce errores de PostgreSQL a mensajes de negocio sin exponer detalles internos.
9. **Inyección en filtros**: `textoBusqueda()` escapa los caracteres reservados de los filtros `or()` de PostgREST.

## Recomendaciones de operación

* Activar **MFA** para administradores (Supabase Auth → MFA) y **protección de contraseñas filtradas**.
* Configurar **SMTP propio** en Supabase para invitaciones y recuperación.
* Habilitar **Point-in-Time Recovery** o backups diarios.
* Revisar periódicamente el **Security Advisor** de Supabase.
* Rotar el token de apisperu si se sospecha exposición: `supabase secrets set APISPERU_TOKEN=nuevo`.
* Datos personales (Ley N.° 29733 de Protección de Datos Personales): limitar exportaciones a quien las necesite e informar a los estudiantes sobre el tratamiento de sus datos.
