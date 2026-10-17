# Guía de instalación y despliegue

## Requisitos

* Node.js 20+ y npm
* Cuenta en [Supabase](https://supabase.com) y [Vercel](https://vercel.com)
* Token de [apisperu.com](https://apisperu.com) para la consulta de DNI
* (Opcional) Supabase CLI `npm i -g supabase` y Vercel CLI `npm i -g vercel`

## 1. Supabase

1. Cree un proyecto (región recomendada: `South America (São Paulo)`).
2. **Base de datos**: abra *SQL Editor*, pegue y ejecute `supabase/migrations/20261016000000_esquema_inicial.sql`. Opcional: `supabase/seed.sql` para datos de ejemplo.
3. **Auth → Providers → Email**: deje activo el inicio con correo. En *Auth → Settings* desactive *Allow new users to sign up* (el alta la hace el administrador).
4. **Auth → URL Configuration**: *Site URL* = URL de Vercel; agregue `http://localhost:5173` en *Redirect URLs*.
5. **Primer administrador**: en *Auth → Users → Add user* cree su usuario (con contraseña). El primer usuario del sistema queda como **Administrador** automáticamente. Si ya existían usuarios:
   ```sql
   update public.usuarios set rol_id = 1 where email = 'usted@empresa.pe';
   ```
6. **Edge Functions y secretos** (con CLI):
   ```bash
   SUPABASE_PROJECT_REF=xxxx \
   APISPERU_TOKEN=su_token \
   ALLOWED_ORIGINS=https://su-app.vercel.app,http://localhost:5173 \
   npm run deploy:supabase
   ```
   Esto ejecuta `supabase db push`, guarda los secretos y publica `consulta-dni` y `crear-usuario`. `SUPABASE_URL`, `SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` las inyecta Supabase automáticamente en las funciones.

## 2. Desarrollo local

```bash
cp .env.example .env.local     # complete VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm install
npm run dev                    # http://localhost:5173
```

Scripts: `npm run build` (typecheck + build), `npm run preview` (probar build y PWA), `npm run typecheck`, `npm run icons` (regenerar íconos, requiere Pillow).

## 3. Vercel

**Opción A – Panel web**: *Add New → Project*, importe el repositorio. Vercel detecta Vite (`vercel.json` ya define build, salida, rewrites SPA y cabeceras). En *Settings → Environment Variables* agregue `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` para Production y Preview.

**Opción B – CLI**:
```bash
vercel login && vercel link
vercel env add VITE_SUPABASE_URL production
vercel env add VITE_SUPABASE_ANON_KEY production
npm run deploy:vercel -- --prod     # sin --prod genera un preview
```

**Opción C – GitHub Actions**: `.github/workflows/ci.yml` compila en cada PR y despliega a producción al hacer push a `main`. Secretos del repositorio: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (los dos últimos están en `.vercel/project.json` tras `vercel link`).

Después del primer despliegue, agregue el dominio final a `ALLOWED_ORIGINS` y a *Auth → URL Configuration*.

## 4. Verificación posterior

- [ ] Iniciar sesión con el administrador
- [ ] Crear un curso y un estudiante (el DNI autocompleta nombres)
- [ ] Inscribir y registrar un pago parcial; ver el saldo
- [ ] Exportar un reporte a Excel y PDF
- [ ] En el móvil: abrir la URL, instalar la app y probar sin conexión
- [ ] Revisar *Auditoría*
