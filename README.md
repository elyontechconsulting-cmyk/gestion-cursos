# Gestión de Cursos

Aplicación web (PWA) para organizaciones de capacitación: cursos, estudiantes con consulta de DNI (RENIEC vía apisperu.com), inscripciones con control de cupos, pagos totales y parciales con saldo automático, dashboard gerencial y reportes exportables a Excel y PDF.

**Stack**: React 18 · Vite 5 · TypeScript · Tailwind CSS · React Router 6 · React Hook Form + Zod · TanStack Query 5 · Zustand 5 · Recharts · SweetAlert2 · Supabase (Postgres, Auth, Edge Functions) · vite-plugin-pwa · Vercel. Formato regional es-PE (S/, dd/mm/aaaa, hora de Lima).

## Inicio rápido

```bash
cp .env.example .env.local   # VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev
```

1. Ejecute `supabase/migrations/20261016000000_esquema_inicial.sql` en el SQL Editor de Supabase.
2. Cree su usuario en *Auth → Users*: el primero queda como administrador.
3. Publique las Edge Functions y guarde el token DNI: `npm run deploy:supabase` (ver guía).

## Documentación

| Documento | Contenido |
|---|---|
| [docs/ARQUITECTURA.md](docs/ARQUITECTURA.md) | Arquitectura, capas, modelo entidad-relación, PWA, escalabilidad |
| [docs/SEGURIDAD.md](docs/SEGURIDAD.md) | Matriz de permisos, RLS, buenas prácticas |
| [docs/DESPLIEGUE.md](docs/DESPLIEGUE.md) | Instalación, Supabase, Vercel, CI/CD |
| [docs/MANUAL_USUARIO.md](docs/MANUAL_USUARIO.md) | Manual para administradores, operadores y consulta |

## Estructura

```
├── public/                    íconos PWA, favicon
├── scripts/                   deploy-vercel.sh, deploy-supabase.sh, generar-iconos.py
├── supabase/
│   ├── migrations/            esquema completo (tablas, RLS, triggers, vistas, RPC)
│   ├── functions/             consulta-dni, crear-usuario (Deno)
│   ├── seed.sql               datos de ejemplo
│   └── config.toml
├── src/
│   ├── api/  components/  contexts/  hooks/  layouts/  lib/
│   ├── pages/  routes/  schemas/  services/  store/  types/  utils/  assets/
│   └── main.tsx
├── vercel.json                rewrites SPA + cabeceras de seguridad (CSP, HSTS)
└── vite.config.ts             PWA (manifest, service worker, caché)
```

## Módulos

| Módulo | Funciones |
|---|---|
| Autenticación | Login, recuperación de contraseña, roles Administrador / Operador / Consulta |
| Cursos | CRUD, búsqueda, filtros, duplicar, ver inscritos, exportar |
| Estudiantes | CRUD, autocompletado por DNI, validación de DNI único, correo y teléfono |
| Inscripciones | Selector con búsqueda, sin duplicados, validación de cupos, cambio de estado |
| Pagos | Pago total o parcial, saldo pendiente, historial, anulación auditada |
| Dashboard | 6 indicadores + gráficos de línea, pie y barras |
| Reportes | Inscritos por curso, financiero, estudiantes · Excel y PDF |
| Administración | Usuarios y roles, auditoría con diferencias antes/después |
